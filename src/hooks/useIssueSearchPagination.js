import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Q } from '@nozbe/watermelondb';
import watermelonManager from '../database/watermelonManager';
import { getAccessibleRegionIds } from '../utils/regionScope';

const PAGE_SIZE = 20;

const emptyTab = () => ({
  issues: [],
  pagination: null,
  loading: false,
  currentPage: 1,
  isLoaded: false,
});

const emptyPagination = (page = 1) => ({
  currentPage: page,
  pageSize: PAGE_SIZE,
  totalCount: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
  startIndex: 0,
  endIndex: 0,
});

/**
 * Custom hook for managing paginated issue search with tab-specific filtering.
 *
 * Scope is regional, not personal: a user sees every issue raised in the
 * regions they are assigned to plus all descendants of those regions, which is
 * the same rule the dashboard statistics use. Filtering on `assignee` alone
 * hid a supervisor's whole caseload behind an empty list.
 *
 * - assigned  — everything in scope, any status ("what I am responsible for")
 * - open      — everything in scope that has not reached the final status
 * - resolved  — everything in scope that has reached the final status
 */
export const useIssueSearchPagination = (currentUserId, statuses = [], userContext = null) => {
  const [tabData, setTabData] = useState({
    open: emptyTab(),
    assigned: emptyTab(),
    resolved: emptyTab(),
  });

  const [activeTab, setActiveTab] = useState('assigned');
  const [issueCounts, setIssueCounts] = useState({
    open: 0,
    assigned: 0,
    resolved: 0,
  });
  const [regionIds, setRegionIds] = useState(null);

  // Use ref to prevent circular dependencies
  const loadedTabsRef = useRef(new Set());

  // Every status that closes an issue. The workflow has more than one
  // ("Resolved" and "Closed"), so this must stay a set — picking a single
  // final status silently emptied the resolved tab.
  const finalStatusIds = useMemo(
    () =>
      statuses
        .filter((status) => {
          const raw = status._raw || status;
          return raw.final_status === true || raw.final_status === 1 || status.finalStatus === true;
        })
        .map((status) => status.id || status._raw?.id)
        .filter(Boolean),
    [statuses]
  );

  // Resolve the user's region scope (assigned regions + all descendants).
  useEffect(() => {
    let cancelled = false;
    if (!userContext) return undefined;

    getAccessibleRegionIds(userContext).then((ids) => {
      if (!cancelled) {
        // Region scope changed: every cached tab result is now stale.
        loadedTabsRef.current.clear();
        setRegionIds(ids);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userContext]);

  // Build the WatermelonDB clauses for a tab.
  const getTabQueryClauses = useCallback(
    (tab) => {
      const clauses = [Q.where('administrative_region', Q.oneOf(regionIds || []))];

      if (finalStatusIds.length > 0) {
        if (tab === 'resolved') {
          clauses.push(Q.where('status', Q.oneOf(finalStatusIds)));
        } else if (tab === 'open') {
          clauses.push(Q.where('status', Q.notIn(finalStatusIds)));
        }
      }

      return clauses;
    },
    [finalStatusIds, regionIds]
  );

  const fetchTabData = useCallback(
    async (tab, page = 1) => {
      if (!currentUserId || statuses.length === 0 || regionIds === null) {
        return;
      }

      setTabData((prev) => ({
        ...prev,
        [tab]: { ...prev[tab], loading: true },
      }));

      try {
        const clauses = getTabQueryClauses(tab);
        const issuesCollection = watermelonManager.getDatabase().get('grm_issues');

        const totalCount = await issuesCollection.query(...clauses).fetchCount();

        const offset = (page - 1) * PAGE_SIZE;
        const records = await issuesCollection
          .query(...clauses, Q.sortBy('issue_date', Q.desc), Q.skip(offset), Q.take(PAGE_SIZE))
          .fetch();

        const issues = records
          .filter((issue) => issue && issue._raw)
          .map((issue) => ({
            ...issue._raw,
            name: issue._raw.id || issue._raw.name,
          }));

        setTabData((prev) => ({
          ...prev,
          [tab]: {
            ...prev[tab],
            issues,
            pagination: {
              currentPage: page,
              pageSize: PAGE_SIZE,
              totalCount,
              totalPages: Math.ceil(totalCount / PAGE_SIZE),
              hasNextPage: page < Math.ceil(totalCount / PAGE_SIZE),
              hasPreviousPage: page > 1,
              startIndex: totalCount > 0 ? offset + 1 : 0,
              endIndex: Math.min(offset + PAGE_SIZE, totalCount),
            },
            loading: false,
            currentPage: page,
            isLoaded: true,
          },
        }));
      } catch (error) {
        console.error(`Error fetching ${tab} tab data:`, error);
        setTabData((prev) => ({
          ...prev,
          [tab]: {
            ...prev[tab],
            loading: false,
            issues: [],
            pagination: emptyPagination(page),
          },
        }));
      }
    },
    [currentUserId, statuses, regionIds, getTabQueryClauses]
  );

  // Load issue counts for tab badges
  const loadIssueCounts = useCallback(async () => {
    if (!currentUserId || regionIds === null) return;

    try {
      const counts = await watermelonManager.getIssueCountsByRegionScope(regionIds);
      setIssueCounts(counts);
    } catch (error) {
      console.error('Error loading issue counts:', error);
    }
  }, [currentUserId, regionIds]);

  // Load data when tab becomes active or when dependencies change
  useEffect(() => {
    if (currentUserId && statuses.length > 0 && regionIds !== null) {
      loadIssueCounts();

      // Load current tab data if not already loaded
      const tabKey = `${activeTab}-${currentUserId}`;
      if (!loadedTabsRef.current.has(tabKey)) {
        loadedTabsRef.current.add(tabKey);
        fetchTabData(activeTab, 1);
      }
    }
  }, [activeTab, currentUserId, statuses.length, regionIds, loadIssueCounts, fetchTabData]);

  // Navigation functions
  const switchTab = useCallback(
    (newTab) => {
      setActiveTab(newTab);

      // Load tab data if not already loaded
      const tabKey = `${newTab}-${currentUserId}`;
      if (!loadedTabsRef.current.has(tabKey)) {
        loadedTabsRef.current.add(tabKey);
        fetchTabData(newTab, 1);
      }
    },
    [fetchTabData, currentUserId]
  );

  const goToNextPage = useCallback(() => {
    const currentTabData = tabData[activeTab];
    if (currentTabData.pagination?.hasNextPage) {
      fetchTabData(activeTab, currentTabData.currentPage + 1);
    }
  }, [activeTab, tabData, fetchTabData]);

  const goToPreviousPage = useCallback(() => {
    const currentTabData = tabData[activeTab];
    if (currentTabData.pagination?.hasPreviousPage) {
      fetchTabData(activeTab, currentTabData.currentPage - 1);
    }
  }, [activeTab, tabData, fetchTabData]);

  const goToPage = useCallback(
    (page) => {
      const currentTabData = tabData[activeTab];
      if (
        page >= 1 &&
        page <= (currentTabData.pagination?.totalPages || 1) &&
        page !== currentTabData.currentPage
      ) {
        fetchTabData(activeTab, page);
      }
    },
    [activeTab, tabData, fetchTabData]
  );

  const refreshCurrentTab = useCallback(() => {
    fetchTabData(activeTab, 1);
    loadIssueCounts();
  }, [activeTab, fetchTabData, loadIssueCounts]);

  // Current tab data
  const currentTabData = tabData[activeTab];

  return {
    // Current tab state
    activeTab,
    issues: currentTabData.issues,
    pagination: currentTabData.pagination,
    loading: currentTabData.loading,
    isLoaded: currentTabData.isLoaded,

    // Tab counts for badges
    issueCounts,

    // Actions
    switchTab,
    goToNextPage,
    goToPreviousPage,
    goToPage,
    refreshCurrentTab,
  };
};

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Q } from '@nozbe/watermelondb';
import watermelonManager from '../database/watermelonManager';

const PAGE_SIZE = 20;

/**
 * Custom hook for managing paginated issue search with tab-specific filtering
 */
export const useIssueSearchPagination = (currentUserId, statuses = []) => {
  // State for each tab's pagination
  const [tabData, setTabData] = useState({
    open: {
      issues: [],
      pagination: null,
      loading: false,
      currentPage: 1,
      isLoaded: false,
    },
    assigned: {
      issues: [],
      pagination: null,
      loading: false,
      currentPage: 1,
      isLoaded: false,
    },
    resolved: {
      issues: [],
      pagination: null,
      loading: false,
      currentPage: 1,
      isLoaded: false,
    },
    all: {
      issues: [],
      pagination: null,
      loading: false,
      currentPage: 1,
      isLoaded: false,
    },
  });

  const [activeTab, setActiveTab] = useState('assigned');
  const [issueCounts, setIssueCounts] = useState({
    open: 0,
    assigned: 0,
    resolved: 0,
    all: 0,
  });

  // Use ref to prevent circular dependencies
  const loadedTabsRef = useRef(new Set());

  // Find final status for filtering
  const finalStatus = useMemo(
    () =>
      statuses.find(
        (status) =>
          status.finalStatus === true ||
          status.final_status === true ||
          (status._raw && (status._raw.final_status === true || status._raw.finalStatus === true))
      ),
    [statuses]
  );

  // Build filters for each tab based on current user and status
  const getTabFilters = useCallback(
    (tab) => {
      const finalStatusId = finalStatus?.id || finalStatus?._raw?.id;

      switch (tab) {
        case 'assigned':
          return {
            assignee: currentUserId,
            excludeStatus: finalStatusId, // Exclude final status
          };

        case 'open':
          return {
            userInvolved: currentUserId, // Special filter for assignee OR reporter
            excludeStatus: finalStatusId,
          };

        case 'resolved':
          return {
            userInvolved: currentUserId,
            status: finalStatusId, // Only final status
          };

        case 'all':
          return {}; // No filters for debug view

        default:
          return {};
      }
    },
    [currentUserId, finalStatus]
  );

  // Enhanced getPaginatedIssues that handles complex filtering
  const fetchTabData = useCallback(
    async (tab, page = 1) => {
      console.log(
        `🔍 [IssueSearchPagination] fetchTabData called for tab: ${tab}, page: ${page}, userId: ${currentUserId}`
      );

      if (!currentUserId || statuses.length === 0) {
        console.log(
          `🔍 [IssueSearchPagination] Missing dependencies - userId: ${currentUserId}, statuses: ${statuses.length}`
        );
        return;
      }

      // Set loading state
      setTabData((prev) => ({
        ...prev,
        [tab]: { ...prev[tab], loading: true },
      }));

      try {
        const filters = getTabFilters(tab);
        let result;

        if (filters.userInvolved) {
          // Handle complex OR queries for open/resolved tabs
          const db = watermelonManager.getDatabase();
          const issuesCollection = db.get('grm_issues');

          // Get total count
          let countQuery;
          if (filters.status) {
            countQuery = issuesCollection.query(
              Q.or(Q.where('assignee', currentUserId), Q.where('reporter', currentUserId)),
              Q.where('status', filters.status)
            );
          } else if (filters.excludeStatus) {
            countQuery = issuesCollection.query(
              Q.or(Q.where('assignee', currentUserId), Q.where('reporter', currentUserId)),
              Q.where('status', Q.notEq(filters.excludeStatus))
            );
          } else {
            countQuery = issuesCollection.query(
              Q.or(Q.where('assignee', currentUserId), Q.where('reporter', currentUserId))
            );
          }

          const totalCount = await countQuery.fetchCount();

          // Get paginated data
          const offset = (page - 1) * PAGE_SIZE;
          let paginatedQuery;

          if (filters.status) {
            paginatedQuery = issuesCollection.query(
              Q.or(Q.where('assignee', currentUserId), Q.where('reporter', currentUserId)),
              Q.where('status', filters.status),
              Q.sortBy('issue_date', Q.desc),
              Q.skip(offset),
              Q.take(PAGE_SIZE)
            );
          } else if (filters.excludeStatus) {
            paginatedQuery = issuesCollection.query(
              Q.or(Q.where('assignee', currentUserId), Q.where('reporter', currentUserId)),
              Q.where('status', Q.notEq(filters.excludeStatus)),
              Q.sortBy('issue_date', Q.desc),
              Q.skip(offset),
              Q.take(PAGE_SIZE)
            );
          } else {
            paginatedQuery = issuesCollection.query(
              Q.or(Q.where('assignee', currentUserId), Q.where('reporter', currentUserId)),
              Q.sortBy('issue_date', Q.desc),
              Q.skip(offset),
              Q.take(PAGE_SIZE)
            );
          }

          const issues = await paginatedQuery.fetch();

          // Convert WatermelonDB models to raw data
          const rawIssues = issues
            .filter((issue) => issue && issue._raw)
            .map((issue) => ({
              ...issue._raw,
              name: issue._raw.id || issue._raw.name,
            }));

          result = {
            issues: rawIssues,
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
          };
        } else {
          // Use simplified filtering for assigned/all tabs
          const cleanFilters = { ...filters };
          delete cleanFilters.excludeStatus;

          if (filters.excludeStatus) {
            // For assigned tab, we need to exclude final status
            cleanFilters.excludeStatusId = filters.excludeStatus;
          }

          result = await watermelonManager.getPaginatedIssues(cleanFilters, page, PAGE_SIZE);
        }

        // Update tab data
        setTabData((prev) => ({
          ...prev,
          [tab]: {
            ...prev[tab],
            issues: result.issues,
            pagination: result.pagination,
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
            pagination: {
              currentPage: page,
              pageSize: PAGE_SIZE,
              totalCount: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPreviousPage: false,
              startIndex: 0,
              endIndex: 0,
            },
          },
        }));
      }
    },
    [currentUserId, statuses, getTabFilters, finalStatus]
  );

  // Load issue counts for tab badges
  const loadIssueCounts = useCallback(async () => {
    if (!currentUserId) return;

    try {
      const counts = await watermelonManager.getIssueCountsByStatus(currentUserId);
      setIssueCounts(counts);
    } catch (error) {
      console.error('Error loading issue counts:', error);
    }
  }, [currentUserId]);

  // Load data when tab becomes active or when dependencies change
  useEffect(() => {
    if (currentUserId && statuses.length > 0) {
      loadIssueCounts();

      // Load current tab data if not already loaded
      const tabKey = `${activeTab}-${currentUserId}`;
      if (!loadedTabsRef.current.has(tabKey)) {
        loadedTabsRef.current.add(tabKey);
        fetchTabData(activeTab, 1);
      }
    }
  }, [activeTab, currentUserId, statuses.length, loadIssueCounts, fetchTabData]);

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
      const nextPage = currentTabData.currentPage + 1;
      fetchTabData(activeTab, nextPage);
    }
  }, [activeTab, tabData, fetchTabData]);

  const goToPreviousPage = useCallback(() => {
    const currentTabData = tabData[activeTab];
    if (currentTabData.pagination?.hasPreviousPage) {
      const prevPage = currentTabData.currentPage - 1;
      fetchTabData(activeTab, prevPage);
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

import { useEffect, useState } from 'react';
import * as IssueService from '../../services/issues/IssueService';
import type { Issue } from '../../models/issues/Issue';
import { useDatabase } from '@nozbe/watermelondb/react';
import { useSelector } from 'react-redux';
import { TABLE_NAMES } from '../../migrations/tableName';
import { useNetInfo } from '@react-native-community/netinfo';
import { removeDuplicatesOptimized } from '../../utils/utils';
import { Q } from '@nozbe/watermelondb';

const PAGE_SIZE = 20
const INITIAL_PREV_PAGE = 0
const INITIAL_NEXT_PAGE = 1;
  

export function useIssue(fetchIssues: boolean = true)  {
  const [assigneeIssueList, setAssigneeIssueList] = useState<Issue[]>();
  const [reporterIssueList, setReporterIssueList] = useState<Issue[]>();
  const [assigneeIssueListAsResolvedUnfiltered, setAssigneeIssueListAsResolvedUnfiltered] =
    useState<Issue[]>();
  const database = useDatabase();
  const { session } = useSelector((state) => {
    return state.get('authentication').toObject();
  });

  const [assigneeOfflinePaginationHasStarted, setAssigneeOfflinePaginationHasStarted] =
    useState(false);
  const [reportedOfflinePaginationHasStarted, setReportedOfflinePaginationHasStarted] =
    useState(false);
  const [resolvedOfflinePaginationHasStarted, setResolvedOfflinePaginationHasStarted] =
    useState(false);
  const [filteredAssigneeList, setFilteredAssigneeList] = useState<Issue[]>();
  const [filteredReporterList, setFilteredReporterList] = useState<Issue[]>();
  const  [searchTerm, setSearchTerm] = useState(null)

  const [endOfReportedListReached, setEndOfReportedListReached] = useState(false);
  const [endOfAssigneeListReached, setEndOfAssigneeListReached] = useState(false);
  const [endOfResolvedListReached, setEndOfResolvedListReached] = useState(false);

  const [
    reporterOfflinePaginatedListRequestControls,
    setReporterOfflinePaginatedListRequestControls,
  ] = useState({
    prevPage: INITIAL_PREV_PAGE,
    nextPage: INITIAL_NEXT_PAGE,
    pageSize: PAGE_SIZE,
  });

  const [
    assigneeOfflinePaginatedListRequestControls,
    setAssigneeOfflinePaginatedListRequestControls,
  ] = useState({
    prevPage: INITIAL_PREV_PAGE,
    nextPage: INITIAL_NEXT_PAGE,
    pageSize: PAGE_SIZE,
  });

  const [
    resolvedOfflinePaginatedListRequestControls,
    setResolvedOfflinePaginatedListRequestControls,
  ] = useState({
    prevPage: INITIAL_PREV_PAGE,
    nextPage: INITIAL_NEXT_PAGE,
    pageSize: PAGE_SIZE,
  });

  const isConnected = useNetInfo().isConnected;

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fetchIssues) return;
    refetch();
  }, []);

  useEffect(() => {
    if (reporterIssueList && assigneeIssueList) {
      setLoading(false);
    }
  }, [searchTerm, reporterIssueList, assigneeIssueList]);

  useEffect(() => {
    const issuesCollection = database.get(TABLE_NAMES.issue);

    const subscription = issuesCollection
      .query()
      .observeWithColumns(['status', 'comments'])
      .subscribe((data) => {
        if (Array.isArray(data)) {
          for (const item of data) {
            const changed = item?._raw?._changed;
            if (typeof changed === 'string' && changed.trim() !== '') {
              refetch();
              break; // Only refetch once per change event
            }
          }
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [database]);

  useEffect(() => {
    if (assigneeIssueList === undefined) {
      fetchAssigneeIssueList(searchTerm);
    }
    if (reporterIssueList === undefined) {
      fetchReporterIssueList(searchTerm);
    }
  }, [assigneeIssueList, reporterIssueList]);

  const refetch = () => {
    setAssigneeIssueList(undefined);
    setReporterIssueList(undefined);
    setAssigneeOfflinePaginationHasStarted(false);
    setReportedOfflinePaginationHasStarted(false);
    setResolvedOfflinePaginationHasStarted(false);
  };

  const fetchAssigneeIssueList = async (searchTerm: string | null = null) => {
    setLoading(true);
    if (!assigneeIssueList) {
      const issuesList = await IssueService.fetchIssueList('assignee',
        false,
        [Q.where('assignee', Q.notEq('null'))],
        searchTerm
      );
      const filteredList = issuesList.filter((issue) =>
        issue.assignee
          ? session.user_id == issue?.assignee?.id || session.user_id == issue.assignee
          : false
      );
      setAssigneeIssueList(filteredList);

    }
  };

  const fetchReporterIssueList = async (searchTerm = null) => {
    setLoading(true);
    if (!reporterIssueList) {
      const issuesList = await IssueService.fetchIssueList('reporter', searchTerm);
      const filteredList = issuesList.filter((issue) =>
        issue.reporter
          ? session.user_id == issue?.reporter?.id || session.user_id == issue.reporter
          : false
      );
      setReporterIssueList(filteredList);
    }
  };

  function prepareListWithoutLastValueRange(completeList, fieldName) {
    const listCopy = completeList.slice();
    for (let index = completeList.length - 1; index >= 0; index--) {
      const element = listCopy[index];
      if (element[fieldName] != completeList[completeList.length - 1][fieldName]) {
        break;
      }
      listCopy.pop();
    }
    return listCopy;
  }

  const fetchMoreReporterIssuesList = async (completeList?: Issue[]) => {
    if (endOfReportedListReached) {
      return;
    }

    if (!completeList || completeList.length === 0) {
      return;
    }

    setLoading(true);

    try {
      const lastItem = completeList[completeList.length - 1];

      const { event, results: nextIssues } = await IssueService.fetchMoreIssueList(
        'reporter',
        reporterOfflinePaginatedListRequestControls,
        {
          fieldName: 'intake_date',
          latestValue: lastItem,
        }
      );

      if (!nextIssues || nextIssues.length === 0) {
        setEndOfReportedListReached(true);
        return;
      }

      // Pagination from local when items don't have from: 'online' (remote adds that in BaseService.getMore)
      const fromOffline = nextIssues.length === 0 || event;
      // const fromOffline = (nextIssues[0] as any)?.from !== 'online';

      if (event?.firstPageRetrievalMade) {
        //next page is after the set of duplicates
        setReporterOfflinePaginatedListRequestControls((prev) => {
          const safePrev = prev ?? {
            prevPage: INITIAL_PREV_PAGE,
            nextPage: INITIAL_NEXT_PAGE,
            pageSize: PAGE_SIZE,
          };

          return {
            pageSize: safePrev.pageSize,
            nextPage: safePrev.nextPage != null ? safePrev.nextPage + 2 : 1,
            prevPage: safePrev.prevPage != null ? safePrev.prevPage + 2 : 0,
          };
        });
      } else if (fromOffline) {
        setReporterOfflinePaginatedListRequestControls((prev) => {
          const safePrev = prev ?? {
            prevPage: INITIAL_PREV_PAGE,
            nextPage: INITIAL_NEXT_PAGE,
            pageSize: PAGE_SIZE,
          };

          return {
            pageSize: PAGE_SIZE,
            nextPage: safePrev.nextPage != null ? safePrev.nextPage + 1 : 1,
            prevPage: safePrev.prevPage != null ? safePrev.prevPage + 1 : 0,
          };
        });
      }

      const nextPageFilteredToUserAsReporter =
        nextIssues.filter((issue) =>
          issue.reporter
            ? session.user_id == issue?.reporter?.id || session.user_id == issue.reporter
            : false
        ) ?? [];

      // Only on first offline page: use trimmed prefix to avoid duplicates around the boundary
      const baseList =
        fromOffline && !reportedOfflinePaginationHasStarted
          ? prepareListWithoutLastValueRange(completeList, 'intake_date')
          : completeList;

      //if no duplicates return setReporterIssueList([...baseList, ...filteredList])
      if (
        removeDuplicatesOptimized(baseList, nextPageFilteredToUserAsReporter).length ===
        baseList.length + nextPageFilteredToUserAsReporter.length
      ) {
        setReporterIssueList([...baseList, ...nextPageFilteredToUserAsReporter]);
        console.log('No Duplicates found');
      } else {
        const baseListUnique = removeDuplicatesOptimized(baseList, baseList);
        const filteredListUnique = removeDuplicatesOptimized(
          nextPageFilteredToUserAsReporter,
          nextPageFilteredToUserAsReporter
        );
        setReporterIssueList([...baseListUnique, ...filteredListUnique]);
        console.log('Duplicates found');
      }
      if (fromOffline && !setReportedOfflinePaginationHasStarted) {
        setReportedOfflinePaginationHasStarted(true);
      }
    } catch (error) {
      console.error('Error paginating more reported issues', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreAssigneeIssuesList = async (completeList?: Issue[]) => {
    if (endOfAssigneeListReached) {
      return;
    }

    if (!completeList || completeList.length === 0) {
      return;
    }

    setLoading(true);

    try {
      const lastItem = completeList[completeList.length - 1];

      const { event, results: nextIssues } = await IssueService.fetchMoreIssueList(
        'assignee',
        assigneeOfflinePaginatedListRequestControls,
        {
          fieldName: 'intake_date',
          latestValue: lastItem,
        },
        [Q.where('assignee', Q.notEq('null'))]
      );

      if (!nextIssues || nextIssues.length === 0) {
        setEndOfAssigneeListReached(true);
        return;
      }

      // Pagination from local when items don't have from: 'online' (remote adds that in BaseService.getMore)
      const fromOffline = nextIssues.length === 0 || event;
      // const fromOffline = (nextIssues[0] as any)?.from !== 'online';

      if (event?.firstPageRetrievalMade) {
        //next page is after the set of duplicates
        setAssigneeOfflinePaginatedListRequestControls((prev) => {
          const safePrev = prev ?? {
            prevPage: INITIAL_PREV_PAGE,
            nextPage: INITIAL_NEXT_PAGE,
            pageSize: PAGE_SIZE,
          };
 
          return {
            pageSize: safePrev.pageSize,
            nextPage: safePrev.nextPage != null ? safePrev.nextPage + 2 : 1,
            prevPage: safePrev.prevPage != null ? safePrev.prevPage + 2 : 0,
          };
        });
      }

      else if (fromOffline) {
        setAssigneeOfflinePaginatedListRequestControls((prev) => {
          const safePrev = prev ?? {
            prevPage: INITIAL_PREV_PAGE,
            nextPage: INITIAL_NEXT_PAGE,
            pageSize: PAGE_SIZE,
          };

          return {
            pageSize: PAGE_SIZE,
            nextPage: safePrev.nextPage != null ? safePrev.nextPage + 1 : 1,
            prevPage: safePrev.prevPage != null ? safePrev.prevPage + 1 : 0,
          };
        });
      }

      const nextPageFilteredToUserAsAssignee =
        nextIssues.filter((issue) =>
          issue.assignee
            ? session.user_id == issue?.assignee?.id || session.user_id == issue.assignee
            : false
        ) ?? [];

      // Only on first offline page: use trimmed prefix to avoid duplicates around the boundary
      const baseList =
        fromOffline && !assigneeOfflinePaginationHasStarted
          ? prepareListWithoutLastValueRange(completeList, 'intake_date')
          : completeList;

      //if no duplicates return setReporterIssueList([...baseList, ...filteredList])
      if (
        removeDuplicatesOptimized(baseList, nextPageFilteredToUserAsAssignee).length ===
        baseList.length + nextPageFilteredToUserAsAssignee.length
      ) {
        setAssigneeIssueList([...baseList, ...nextPageFilteredToUserAsAssignee]);
        console.log('No Duplicates found');
      } else {
        const baseListUnique = removeDuplicatesOptimized(baseList, baseList);
        const filteredListUnique = removeDuplicatesOptimized(
          nextPageFilteredToUserAsAssignee,
          nextPageFilteredToUserAsAssignee
        );
        setAssigneeIssueList([...baseListUnique, ...filteredListUnique]);
        console.log('Duplicates found');
      }
      if (fromOffline && !assigneeOfflinePaginationHasStarted) {
        setAssigneeOfflinePaginationHasStarted(true);
      }
    } catch (error) {
      console.error('Error paginating more assigned issues', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreResolvedIssueList = async (completeList?: Issue[]) => {
    fetchMoreAssigneeIssuesList(completeList)
  };

  const createIssue = async (issue: Issue) => {
    setLoading(true)
    const createdIssue = await IssueService.createIssue(issue);
    setLoading(false);
    return createdIssue;
  }
  
  const updateIssue = async (issue: Issue) => {
    return await IssueService.updateIssue(issue);
  }

  const fetchTrackingCodeIssueList = (term: string | null) => {
    if (!term || term.length === 0) {
      setFilteredAssigneeList(assigneeIssueList);
      setFilteredReporterList(reporterIssueList);
      return;
    }
    const lowerTerm = term.toLowerCase();
    setFilteredAssigneeList(
      assigneeIssueList?.filter(issue =>
        issue.tracking_code?.toLowerCase().includes(lowerTerm)
      )
    );
    setFilteredReporterList(
      reporterIssueList?.filter(issue =>
        issue.tracking_code?.toLowerCase().includes(lowerTerm)
      )
    );

  };

  return {
    assigneeIssueList: filteredAssigneeList ?? assigneeIssueList,
    reporterIssueList: filteredReporterList ?? reporterIssueList,
    loading,
    createIssue,
    updateIssue,
    fetchMoreReporterIssueList: fetchMoreReporterIssuesList,
    fetchMoreAssigneeIssueList: fetchMoreAssigneeIssuesList,
    fetchMoreResolvedIssueList: fetchMoreResolvedIssueList,
    fetchTrackingCodeIssueList: fetchTrackingCodeIssueList
  };
}
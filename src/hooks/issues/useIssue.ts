import { useEffect, useState } from 'react'
import * as IssueService from '../../services/issues/IssueService';
import type { Issue } from "../../models/issues/Issue";
import { useDatabase } from '@nozbe/watermelondb/react';
import { useSelector } from 'react-redux';
import { TABLE_NAMES } from '../../migrations/tableName';
import { useNetInfo } from '@react-native-community/netinfo';
  
export type OfflinePaginatedListRequest = {
    prevPage: number;
    nextPage: number;
    pageSize: number;
  };

export function useIssue(fetchIssues: boolean = true)  {
  const [assigneeIssueList, setAssigneeIssueList] = useState<Issue[]>()
  const [reporterIssueList, setReporterIssueList] = useState<Issue[]>()
  const database = useDatabase();
  const { session } = useSelector((state) => {
      return state.get("authentication").toObject();
  });
  const [offlinePaginationHasStarted, setOfflinePaginationHasStarted] = useState(false);
  const [endOfReportedListReached, setEndOfReportedListReached] = useState(false);
  const [endOfAssigneeListReached, setEndOfAssigneeListReached] = useState(false);
  const [endOfResolvedListReached, setEndOfResolvedListReached] = useState(false);
  
  const [offlinePaginatedListRequest, setOfflinePaginatedListRequest] = useState({
    prevPage: null,
    nextPage: null,
    pageSize: 5,
  });

  const isConnected = useNetInfo().isConnected;

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fetchIssues) return;
    refetch();
  }, []);
  
  useEffect(() => {
    if (reporterIssueList && assigneeIssueList) {   
      setLoading(false)
    }
  }, [reporterIssueList, assigneeIssueList])

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
  }, [database])

  useEffect(() => {
    if (assigneeIssueList === undefined) {
      fetchAssigneeIssueList();
    }
    if (reporterIssueList === undefined) {
      fetchReporterIssueList();
    }
  }, [assigneeIssueList, reporterIssueList])
  
  const refetch = () => {
    setAssigneeIssueList(undefined);
    setReporterIssueList(undefined);
    setOfflinePaginationHasStarted(false); // reset so next offline run can trim again
  };
  
  const fetchAssigneeIssueList = async () => { 
    setLoading(true)
    if (!assigneeIssueList) {
      const issuesList = await IssueService.fetchIssueList('assignee');
      const filteredList = issuesList.filter((issue) =>
        issue.assignee
          ? (session.user_id == issue?.assignee?.id || session.user_id == issue.assignee)
          : false
      );
      setAssigneeIssueList(filteredList);
    }
  }

  const fetchReporterIssueList = async () => {
    setLoading(true);
    if (!reporterIssueList) {
      const issuesList = await IssueService.fetchIssueList('reporter');
      const filteredList = issuesList.filter((issue) =>
        issue.reporter
          ? (session.user_id == issue?.reporter?.id || session.user_id == issue.reporter)
          : false
      );
      setReporterIssueList(filteredList);
    }
  }

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
    
  const fetchMoreReporterIssueList = async (completeList?: Issue[]) => {
    if (endOfReportedListReached) {
      return;
    }

    if (!completeList || completeList.length === 0) {
      return;
    }

    setLoading(true);

    try {
      const listWithoutLastValueRange = prepareListWithoutLastValueRange(
        completeList,
        'intake_date'
      );

      const lastItem = completeList[completeList.length - 1];

      const {result: nextIssues, from} = await IssueService.fetchMoreIssueList(
        'reporter',
        offlinePaginatedListRequest,
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
      const fromOffline = nextIssues.length === 0 || from === 'offline';

      if (fromOffline) {
        setOfflinePaginatedListRequest((prev) => {
          const safePrev = prev ?? {
            prevPage: null,
            nextPage: null,
            pageSize: offlinePaginatedListRequest.pageSize,
          };

          return {
            pageSize: safePrev.pageSize,
            nextPage: safePrev.nextPage != null ? safePrev.nextPage + 1 : 1,
            prevPage: safePrev.prevPage != null ? safePrev.prevPage + 1 : 0,
          };
        });
      }

      const filteredList =
        nextIssues.filter((issue) =>
          issue.reporter
            ? session.user_id == issue?.reporter?.id || session.user_id == issue.reporter
            : false
        ) ?? [];

      // First time we get offline results: clean list (trim last intake_date range) then append. Later: use full list.
      const baseList =
        fromOffline && !offlinePaginationHasStarted ? listWithoutLastValueRange : completeList;

      if (fromOffline) {
        setOfflinePaginationHasStarted(true);
      }

      setReporterIssueList([...baseList, ...filteredList]);
    } catch (error) {
      console.error('Error paginating more reported issues', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMoreAssigneeIssueList = async (completeList?: Issue[]) => {
    // setLoading(true);
    // const issuesList = await IssueService.fetchMoreIssueList('assignee', latestValue);
    // const filteredList = issuesList.filter((issue) =>
    //   issue.assignee
    //     ? session.user_id == issue?.assignee?.id || session.user_id == issue.assignee
    //     : false
    // );
    // setAssigneeIssueList([...assigneeIssueList, ...filteredList]);
  };

  const createIssue = async (issue: Issue) => {
    setLoading(true)
    const createdIssue = await IssueService.createIssue(issue);
    setLoading(false);
    return createdIssue;
  }
  
  const updateIssue = async (issue: Issue) => {
    const updatedIssue = await IssueService.updateIssue(issue)
    return updatedIssue;
  }
    
  return {
    assigneeIssueList,
    reporterIssueList,
    loading,
    createIssue,
    updateIssue,
    fetchMoreReporterIssueList,
    fetchMoreAssigneeIssueList,
  };
}
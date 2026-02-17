import { useEffect, useState } from 'react'
import * as IssueService from '../../services/issues/IssueService';
import type { Issue } from "../../models/issues/Issue";
import { useDatabase } from '@nozbe/watermelondb/react';
import { useSelector } from 'react-redux';
import { TABLE_NAMES } from '../../migrations/tableName';
import { useNetInfo } from '@react-native-community/netinfo';

export function useIssue(fetchIssues: boolean = true) {
  const [assigneeIssueList, setAssigneeIssueList] = useState<Issue[]>()
  const [reporterIssueList, setReporterIssueList] = useState<Issue[]>()
  const database = useDatabase();
  const { session } = useSelector((state) => {
      return state.get("authentication").toObject();
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
  }
  
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
  
  const fetchMoreReporterIssueList = async (completeList?: Issue[]) => {
    setLoading(true);

    const issuesList = await IssueService.fetchMoreIssueList('reporter', {
      completeList,
      fieldName: 'intake_date',
    });
    const filteredList = issuesList.filter((issue) =>
      issue.reporter
        ? session.user_id == issue?.reporter?.id || session.user_id == issue.reporter
        : false
    );
    setReporterIssueList([...reporterIssueList, ...filteredList]);
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
import { useEffect, useState } from 'react'
import * as IssueService from '../../services/issues/IssueService';
import type { Issue } from "../../models/issues/Issue";
import { useDatabase } from '@nozbe/watermelondb/react';
import { useSelector } from 'react-redux';
import { TABLE_NAMES } from '../../migrations/tableName';

export function useIssue(fetchIssues: boolean = true) {
  const [assigneeIssueList, setAssigneeIssueList] = useState<Issue[]>()
  const database = useDatabase();
  const { session } = useSelector((state) => {
      return state.get("authentication").toObject();
  });
  
  const [reporterIssueList, setReporterIssueList] = useState<Issue[]>()
  const [loading, setLoading] = useState(false);

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
      const filteredList = issuesList.filter((issue) => issue.assignee ? session.user_id == issue.assignee.id : false)
      setAssigneeIssueList(filteredList);
    }
  }

  const fetchReporterIssueList = async () => {
    setLoading(true);
    if (!reporterIssueList) {
      const issuesList = await IssueService.fetchIssueList('reporter');
      const filteredList = issuesList.filter((issue) => issue.reporter ? session.user_id == issue.reporter.id : false);
      setReporterIssueList(filteredList);
    }
  }

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
    
  return { assigneeIssueList, reporterIssueList, loading, createIssue, updateIssue }
}
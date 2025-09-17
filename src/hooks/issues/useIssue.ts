import { useEffect, useState } from 'react'
import * as IssueService from '../../services/issues/IssueService';
import type { Issue } from "../../models/issues/Issue";
import { useDatabase } from '@nozbe/watermelondb/react';
import { useSelector } from 'react-redux';

export function useIssue() {
  const [assigneeIssueList, setAssigneeIssueList] = useState<Issue[]>()
  const database = useDatabase();
  const { session } = useSelector((state) => {
      return state.get("authentication").toObject();
    });
  const [reporterIssueList, setReporterIssueList] = useState<Issue[]>()
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetchAssigneeIssueList();
    fetchReporterIssueList();
  }, []);

  useEffect(() => {
    if (reporterIssueList && assigneeIssueList) {   
      setLoading(false)
    }
  }, [reporterIssueList, assigneeIssueList])
    
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
      let issuesList = await IssueService.fetchIssueList('reporter');
      issuesList = issuesList.filter((issue) => issue.reporter ? session.user_id == issue.reporter.id : false);
      setReporterIssueList(issuesList);
    }
  }

  const createIssue = async (issue: Issue) => {
    setLoading(true)
    const createdIssue = await IssueService.createIssue(issue);
    setLoading(false);
    return createdIssue;
  }
  
  const updateIssue = async (issue: Issue) => {
    setLoading(true)
    const updatedIssue = await IssueService.updateIssue(issue)
    setLoading(false);
    return updatedIssue;
  }
    
  return { assigneeIssueList, reporterIssueList, loading, createIssue, updateIssue }
}
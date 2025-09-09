import { useEffect, useState } from 'react'
import * as IssueService from '../../services/issues/IssueService';
import type { Issue } from "../../models/issues/Issue";

export function useIssue() {
  const [assigneeIssueList, setAssigneeIssueList] = useState<Issue[]>()
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
        console.log("$##@@ ISSUE LIST: ", issuesList); 
        setAssigneeIssueList(issuesList);
      }
  }

  const fetchReporterIssueList = async () => {
    setLoading(true);
    if (!reporterIssueList) {
      const issuesList = await IssueService.fetchIssueList('reporter');
      console.log('$##@@ ISSUE LIST: ', issuesList);
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
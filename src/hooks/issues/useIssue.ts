import { useEffect, useState } from 'react'
import * as IssueService from '../../services/issues/IssueService';
import type { Issue } from "../../models/issues/Issue";

export function useIssue() {
  const [issueList, setIssueList] = useState<Issue[]>()
  const [loading, setLoading] = useState(false);
    
  useEffect(() => {
    fetchIssueList();
  }, []);
    
  const fetchIssueList = async () => {
      setLoading(true)
      if (!issueList) {
        const issuesList = await IssueService.fetchIssueList()
        setIssueList(issuesList);
      }
      setLoading(false);
  }
  
  const createIssue = async (issue: Issue) => {
    setLoading(true)
    const createdIssue = await IssueService.createIssue(issue);
    setLoading(false);
    return createdIssue;
  }
    
  return { issueList, loading, createIssue }
}
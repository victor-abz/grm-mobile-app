import { useEffect, useState } from 'react'
import { Issue } from "../../models/Issue";
import * as IssueService from '../../services/issues/IssueService';

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
    
    return [issueList, loading]
}
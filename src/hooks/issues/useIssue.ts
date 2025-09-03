import { useEffect, useState } from 'react'
import * as IssueService from '../../services/issues/IssueService';
import { Issue } from "../../models/issues/Issue";

export function useIssue() {
  const [issues, setIssues] = useState<Issue[]>()
  const [loadingIssues, setLoadingIssues] = useState(true);
    
  useEffect(() => {
    fetchIssueList().then(() => {
      setLoadingIssues(false);
    });
  }, []);
    
  const fetchIssueList = async () => {
      setLoadingIssues(true)

      if (!issues) {
        const issuesList = await IssueService.fetchIssueList()
        setIssues(issuesList);
      }
    }
    return { issues, loadingIssues }
}
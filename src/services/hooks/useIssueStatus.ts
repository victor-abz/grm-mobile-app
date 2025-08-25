import { useEffect, useState } from 'react'
import * as IssueStatusService from '../shared/IssueStatusService';
import type { IssueStatus } from "../../models/IssueStatus";

export function useIssueStatus() {
  const [issueStatusList, setIssueStatusList] = useState<IssueStatus[]>()
  const [loading, setLoading] = useState(false);
    
  useEffect(() => {
    fetchIssueStatusList();
  }, []);
    
  const fetchIssueStatusList = async () => {
      setLoading(true)
      if (!issueStatusList) {
        const issuesList = await IssueStatusService.fetchIssueStatusList()
        setIssueStatusList(issuesList);
      }
      setLoading(false);
    }
    
  return { issueStatusList, loading }
}
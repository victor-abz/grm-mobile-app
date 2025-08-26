import { useEffect, useState } from 'react'
import * as IssueStatusService from '../../services/issues/IssueStatusService';
import { IssueStatus } from "../../models/issues/IssueStatus";

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
    
    return [issueStatusList, loading]
}
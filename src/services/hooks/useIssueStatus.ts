import { useEffect, useState } from 'react'
import * as IssueStatusService from '../shared/IssueStatusService';
import { IssueStatusModel } from '../../repositories/remote/IssueStatusRemoteRepository';

export function useIssueStatus() {
  const [issueStatusList, setIssueStatusList] = useState<IssueStatusModel[]>()
  const [loading, setLoading] = useState(false);
    
  useEffect(() => {
    fetchIssueStatusList();
  }, []);
    
  const fetchIssueStatusList = async () => {
      setLoading(true)
      if (!issueStatusList) {
        const issuesList = await IssueStatusService.fetchIssueStatusList()
        console.log("HOOK DATA:", issuesList);
        
        setIssueStatusList(issuesList);
      }
      setLoading(false);
    }
    
    return [issueStatusList, loading]
}
import { useEffect, useState } from 'react'
import * as IssueStatusService from '../../services/issues/IssueStatusService';
import type { IssueStatus } from "../../models/issues/IssueStatus";

export function useIssueStatus() {
  const [issueStatusList, setIssueStatusList] = useState<IssueStatus[]>()
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("LAUNCH FETCH");
    
    fetchIssueStatusList();
  }, []);

  const fetchIssueStatusList = async () => {
    setLoading(true)
    if (!issueStatusList) {
        console.log("Before fetch");
        
        const issuesStatusList = await IssueStatusService.fetchIssueStatusList();
        console.log('Setting hook issue statuses list as:', issuesStatusList);
        console.log("After fetch");
        setIssueStatusList(issuesStatusList);      
      }
      setLoading(false);
    }

  return { issueStatusList, loading }
}

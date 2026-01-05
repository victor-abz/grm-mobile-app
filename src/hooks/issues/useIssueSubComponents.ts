import { useEffect, useState } from 'react'
import * as IssueSubComponentService from '../../services/issues/IssueSubComponentService';
import type { IssueSubComponent } from "../../models/issues/IssueSubComponent";

export function useIssueSubComponents() {
  const [issueSubComponentsList, setIssueSubComponentsList] = useState<IssueSubComponent[]>()
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssueSubComponentsList();
  }, []);

  const fetchIssueSubComponentsList = async () => {

    setLoading(true)
    if (!issueSubComponentsList) {
      const issuesSubComponentsList = await IssueSubComponentService.fetchIssueSubComponentsList();
        setIssueSubComponentsList(issuesSubComponentsList);
      }
      setLoading(false);
    }

  return { issueSubComponentsList, loading }
}

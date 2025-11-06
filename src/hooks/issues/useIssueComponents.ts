import { useEffect, useState } from 'react'
import * as IssueComponentService from '../../services/issues/IssueComponentService';
import type { IssueComponent } from "../../models/issues/IssueComponent";

export function useIssueComponents() {
  const [issueComponentsList, setIssueComponentsList] = useState<IssueComponent[]>()
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssueComponentsList();
  }, []);

  const fetchIssueComponentsList = async () => {

      setLoading(true)
    if (!issueComponentsList) {
      const issuesComponentsList = await IssueComponentService.fetchIssueComponentsList();
        setIssueComponentsList(issuesComponentsList);
      }
      setLoading(false);
    }

  return { issueComponentsList, loading }
}

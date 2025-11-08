import { useEffect, useState } from 'react'
import * as IssueSubTypeService from '../../services/issues/IssueSubTypeService';
import type { IssueSubType } from "../../models/issues/IssueSubType";

export function useIssueSubTypes() {
  const [issueSubTypesList, setIssueSubTypesList] = useState<IssueSubType[]>()
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssueSubTypesList();
  }, []);

  const fetchIssueSubTypesList = async () => {

      setLoading(true)
    if (!issueSubTypesList) {
      const issuesSubTypesList = await IssueSubTypeService.fetchIssueSubTypesList();
        setIssueSubTypesList(issuesSubTypesList);
      }
      setLoading(false);
    }

  return { issueSubTypesList, loading }
}


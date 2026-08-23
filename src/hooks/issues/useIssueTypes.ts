import { useEffect, useState } from 'react'
import * as IssueTypeService from '../../services/issues/IssueTypeService';
import type { IssueType } from "../../models/issues/IssueType";

export function useIssueTypes() {
  const [issueTypesList, setIssueTypesList] = useState<IssueType[]>()
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssueTypesList();
  }, []);

  const fetchIssueTypesList = async () => {
      setLoading(true)
      if (!issueTypesList) {
        const issuesList = await IssueTypeService.fetchIssueTypesList()
        setIssueTypesList(issuesList);
      }
      setLoading(false);
    }

  return { issueTypesList, loading }
}


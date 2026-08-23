import { useEffect, useState } from 'react'
import * as IssueAgeService from '../../services/issues/IssueAgeGroupService';
import type { IssueAgeGroup } from "../../models/issues/IssueAgeGroup";

export function useIssueAges() {
  const [issueAgesList, setIssueAgesList] = useState<IssueAgeGroup[]>()
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssueAgesList();
  }, []);

  const fetchIssueAgesList = async () => {
      setLoading(true)
      if (!issueAgesList) {
        const issuesList = await IssueAgeService.fetchIssueAgeGroupList();
        setIssueAgesList(issuesList);
      }
      setLoading(false);
    }

  return { issueAgesList, loading }
}


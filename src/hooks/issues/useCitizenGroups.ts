import { useEffect, useState } from 'react';
import * as IssueCitizenGroupService from '../../services/issues/IssueCitizenGroupService';
import type { IssueCitizenGroup } from '../../models/issues/IssueCitizenGroup';

export function useIssueCitizenGroups() {
  const [issueCitizenGroupsList, setIssueCitizenGroupsList] = useState<IssueCitizenGroup[]>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssueCitizenGroupsList();
  }, []);

  const fetchIssueCitizenGroupsList = async () => {
    setLoading(true);
    if (!issueCitizenGroupsList) {
      const issuesList = await IssueCitizenGroupService.fetchIssueCitizenGroupList();
      setIssueCitizenGroupsList(issuesList);
    }
    setLoading(false);
  };

  return { issueCitizenGroupsList, loading };
}

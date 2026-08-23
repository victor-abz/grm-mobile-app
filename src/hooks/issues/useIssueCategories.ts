import { useEffect, useState } from 'react'
import * as IssueCategoryService from '../../services/issues/IssueCategoryService';
import type { IssueCategory } from '../../models/issues/IssueCategory';

export function useIssueCategories() {
  const [issueCategoriesList, setIssueCategoriesList] = useState<IssueCategory[]>()
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssueCategoriesList();
  }, []);

  const fetchIssueCategoriesList = async () => {
      setLoading(true)
      if (!issueCategoriesList) {
          const issuesList = await IssueCategoryService.fetchIssueCategoriesList();
        setIssueCategoriesList(issuesList);
      }
      setLoading(false);
    }

    return { issueCategoriesList, loading }
}


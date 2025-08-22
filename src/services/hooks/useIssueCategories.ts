import { useEffect, useState } from 'react'
import * as IssueCategoryService from '../shared/IssueCategoryService';
import { IssueCategory } from '../../models/IssueCategory';

export function useIssueCategories() {
  const [issueCategoriesList, setIssueCategoriesList] = useState<IssueCategory[]>()
  const [loading, setLoading] = useState(false);
    
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
import { useEffect, useState } from 'react'
import * as IssueCommentService from '../../services/issues/IssueCommentService';
import { IssueComment } from "../../models/issues/IssueComment";

export function useIssueComments(parentId: string) {
  const [issueCommentsList, setIssueCommentsList] = useState<IssueComment[]>()
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIssueCommentsList(parentId);
  }, []);

  const fetchIssueCommentsList = async (parentId: string) => {
      setLoading(true)
      if (!issueCommentsList) {
        const issuesList = await IssueCommentService.fetchIssueCommentList(parentId)
        setIssueCommentsList(issuesList);
      }
      setLoading(false);
    }

  return { issueCommentsList, loading }
}


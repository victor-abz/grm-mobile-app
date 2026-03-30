import { useEffect, useState } from 'react'
import * as IssueCommentService from '../../services/issues/IssueCommentService';
import { IssueComment, IssueCommentLocalModel } from "../../models/issues/IssueComment";

export function useIssueComments(parentId: string) {
  const [issueCommentsList, setIssueCommentsList] = useState<IssueComment[]>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIssueCommentsList(parentId);
  }, []);

  const fetchIssueCommentsList = async (parentId: string) => {
    setLoading(true);
    if (!issueCommentsList) {
      const comments = await IssueCommentService.fetchIssueCommentList(parentId);
      comments.reverse()
      setIssueCommentsList(comments);
    }
    setLoading(false);
  };

  const createIssueComment = async (issueComment: IssueComment) => {
    setLoading(true);
    const comment = await IssueCommentService.createIssueComment(issueComment);
    setIssueCommentsList([...issueCommentsList, comment]);
    setLoading(false);
  };

  return { issueCommentsList, loading, createIssueComment };
}


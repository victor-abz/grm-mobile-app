import { useEffect, useState } from 'react'
import * as IssueCommentService from '../../services/issues/IssueCommentService';
import { IssueComment } from "../../models/issues/IssueComment";

export function useIssueComments(parentId: string, disabledList = false) {
  const PAGE_SIZE = 20;
  const [issueCommentsList, setIssueCommentsList] = useState<IssueComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    // initial load for new parentId
    if (disabledList) { return;  }
    setIssueCommentsList([]);
    setPage(0);
    setHasMore(true);
    fetchIssueCommentsPage(0);
  }, [parentId]);

  const refreshComments = () => {
    setIssueCommentsList([]);
    setPage(0);
    setHasMore(true);
    fetchIssueCommentsPage(0);
  }

  const fetchIssueCommentsPage = async (pageToLoad: number) => {
    setLoading(true);
    const comments = await IssueCommentService.fetchIssueCommentList(
      parentId,
      pageToLoad,
      PAGE_SIZE
    );
    const safeComments = Array.isArray(comments) ? comments : [];
    setHasMore(safeComments.length >= PAGE_SIZE);

    // Keep chronological order (oldest -> newest) for chat-like UI
    setIssueCommentsList((prev) => {
      const merged = [...safeComments, ...prev];
      const seen = new Set<string>();
      const deduped = merged.filter((c: any) => {
        const key = String(c?.id ?? c?.created_date ?? JSON.stringify(c));
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      deduped.sort((a: any, b: any) => {
        const aTime = new Date(a?.created_date ?? 0).getTime();
        const bTime = new Date(b?.created_date ?? 0).getTime();
        return bTime - aTime;
      });
      return deduped;
    });
    setLoading(false);
  };

  const loadMore = async () => {
    if (loadingMore || loading || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      
      console.log(nextPage);
      console.log(parentId);
      
      const comments = await IssueCommentService.fetchIssueCommentList(parentId, nextPage, PAGE_SIZE);
      console.log(comments);

      const safeComments = Array.isArray(comments) ? comments : [];
      setHasMore(safeComments.length >= PAGE_SIZE);

      setIssueCommentsList((prev) => {
        const merged = [...safeComments, ...prev];
        const seen = new Set<string>();
        const deduped = merged.filter((c: any) => {
          const key = String(c?.id ?? c?.due_date ?? JSON.stringify(c));
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        deduped.sort((a: any, b: any) => {
          const aTime = new Date(a?.due_date ?? a?.created_date ?? 0).getTime();
          const bTime = new Date(b?.due_date ?? b?.created_date ?? 0).getTime();
          return bTime - aTime;
        });
        return deduped;
      });
      setPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
  };

  const createIssueComment = async (issueComment: IssueComment) => {
    setLoading(true);
    const comment = await IssueCommentService.createIssueComment(issueComment);
    if (comment) {
      setIssueCommentsList([comment, ...issueCommentsList]);
    } else {
      throw new Error('Error creating comment')
    }
    setLoading(false);
  };

  return {
    issueCommentsList,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    createIssueComment,
    refreshComments,
  };
}


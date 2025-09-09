import { useEffect, useState } from 'react'
import { IssueAttachment } from "../../models/issues/IssueAttachment";
import * as IssueAttachmentService from '../../services/issues/IssueAttachmentService';

export function useIssueAttachments(parentId: string) {
  const [issueAttachmentsList, setIssueAttachmentsList] = useState<IssueAttachment[]>()
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIssueAttachmentsList(parentId);
  }, []);

  const fetchIssueAttachmentsList = async (parentId: string) => {
      setLoading(true)
      if (!issueAttachmentsList) {
        const attachmentList = await IssueAttachmentService.fetchIssueAttachmentList(parentId)
        setIssueAttachmentsList(attachmentList);
      }
      setLoading(false);
    }

  return { issueAttachmentsList, loading }
}


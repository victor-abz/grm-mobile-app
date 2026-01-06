import { useEffect, useState } from 'react'
import { IssueAttachment } from "../../models/issues/IssueAttachment";
import * as IssueAttachmentService from '../../services/issues/IssueAttachmentService';
import { TABLE_NAMES } from '../../migrations/tableName';

export function useIssueAttachments(parentId?: string) {
  const [issueAttachmentsList, setIssueAttachmentsList] = useState<IssueAttachment[]>()
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (parentId) {
      fetchIssueAttachmentsList(parentId);
    }
  }, []);

  const refetchAttachment = async (attachmentId: string) => {
    setLoading(true);
    await IssueAttachmentService.refetchAttachment(attachmentId)
    setLoading(false);
  }

  const createAttachment = async (attachment: IssueAttachment) => {
    setLoading(true)
    console.log("Creating attachments...");
    const response = await IssueAttachmentService.createIssueAttachment(attachment);

    if (response) {
      console.log("Attachments created. Response: ", response);
    }
    
    setLoading(false);
  }

  const fetchIssueAttachmentsList = async (parentId: string) => {
    setLoading(true);
    if (!issueAttachmentsList) {
      const attachmentList = await IssueAttachmentService.fetchIssueAttachmentList(parentId);
      setIssueAttachmentsList(attachmentList);
    }
    setLoading(false);
   
  };

  return { issueAttachmentsList, loading, createAttachment, refetchAttachment };
}

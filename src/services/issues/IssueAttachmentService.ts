import { BaseService } from '../shared/BaseService';
import { TABLE_NAMES } from "../../migrations/tableName";
import { IssueAttachment } from "../../models/issues/IssueAttachment";
import { IssueAttachmentLocalRepository } from "../../repositories/local/issues/IssueAttachmentLocalRepository";
import IssueAttachmentRemoteRepository from "../../repositories/remote/issues/IssueAttachmentRemoteRepository";

const localRepository = new IssueAttachmentLocalRepository();
const remoteRepository = new IssueAttachmentRemoteRepository();

const issueAttachmentService = new BaseService<IssueAttachment>(localRepository, remoteRepository);

export async function fetchIssueAttachmentList(parentId: string): Promise<IssueAttachment[] | null> {
  try {
    return await issueAttachmentService.getAll(parentId);
  } catch (error) {
    console.error('Error syncing issues attachment:', error);
  }
}

export const issueAttachmentSyncable = {
  pushChanges: ({ changes, lastPulledAt }) =>
    issueAttachmentService.pushChanges({ changes, lastPulledAt }),
  pullChanges: ({ tableName, lastPulledAt }) => issueAttachmentService.pullChanges({ tableName, lastPulledAt }),
  tableName:  TABLE_NAMES.issueAttachment,
};

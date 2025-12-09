import { BaseService, CreatedResponseWithBackendId, WatermelonId } from '../shared/BaseService';
import { TABLE_NAMES } from "../../migrations/tableName";
import { IssueAttachment } from "../../models/issues/IssueAttachment";
import { IssueAttachmentLocalRepository } from "../../repositories/local/issues/IssueAttachmentLocalRepository";
import IssueAttachmentRemoteRepository from "../../repositories/remote/issues/IssueAttachmentRemoteRepository";
import { Syncable } from '../shared/SyncService';

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

export async function createIssueAttachment(attachment: IssueAttachment): Promise<IssueAttachment[] | null> {
  try {
    
    return await issueAttachmentService.upsert(attachment)
  } catch (error) {
    console.error('Error syncing issues attachment:', error);
  }
}

export const issueAttachmentSyncable: Syncable = {
  pushChanges: ({ changes, lastPulledAt }) =>
    issueAttachmentService.pushChanges({ changes, lastPulledAt }),
  pullChanges: ({ tableName, lastPulledAt, parentIds })     =>
    issueAttachmentService.pullChanges({ tableName, lastPulledAt, parentIds }),
  tableName: TABLE_NAMES.issueAttachment,
  replaceParentIds: (idsToReplace: [CreatedResponseWithBackendId, WatermelonId][]): Promise<{message: string, error?: undefined}> =>
    issueAttachmentService.replaceParentIdProperty(idsToReplace),
};

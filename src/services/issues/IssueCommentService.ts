import { BaseService, CreatedResponseWithBackendId, WatermelonId } from '../shared/BaseService';
import { TABLE_NAMES } from "../../migrations/tableName";
import { IssueComment } from "../../models/issues/IssueComment";
import { IssueCommentLocalRepository } from "../../repositories/local/issues/IssueCommentLocalRepository";
import IssueCommentRemoteRepository from "../../repositories/remote/issues/IssueCommentRemoteRepository";
import { SyncStatus } from '@nozbe/watermelondb/Model';
import { Syncable } from '../shared/types';

const localRepository = new IssueCommentLocalRepository();
const remoteRepository = new IssueCommentRemoteRepository();

const issueCommentService = new BaseService<IssueComment>(localRepository, remoteRepository);

export async function fetchIssueCommentList(parentId: string): Promise<IssueComment[] | null> {
  try {
    return await issueCommentService.getAll(parentId);
  } catch (error) {
    console.error('Error syncing issues comment:', error);
  }
}

export async function createIssueComment(issueComment: IssueComment): Promise<IssueComment | null> {
  try {
    const createdComment: any = await issueCommentService.upsert(issueComment);
    return createdComment
  } catch (error) {
    console.error('Error syncing issues comment:', error);
  }
}

export const issueCommentSyncable: Syncable = {
  pushChanges: ({ changes, lastPulledAt }) =>
    issueCommentService.pushChanges({ changes, lastPulledAt }),
  pullChanges: ({ tableName, lastPulledAt, parentChanges }) =>
    issueCommentService.pullChanges({ tableName, lastPulledAt, parentChanges }),
  tableName: TABLE_NAMES.issueComment,
  replaceParentIds: (
    idsToReplace: [CreatedResponseWithBackendId, WatermelonId][],
    status?: SyncStatus
  ): Promise<{ message: string; error?: undefined }> =>
    issueCommentService.replaceParentIdProperty(idsToReplace, status),
};

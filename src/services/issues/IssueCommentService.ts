import { BaseService } from '../shared/BaseService';
import { TABLE_NAMES } from "../../migrations/tableName";
import { IssueTypeLocalRepository } from "../../repositories/local/issues/IssueTypeLocalRepository";
import IssueTypeRemoteRepository from "../../repositories/remote/issues/IssueTypeRemoteRepository";
import { IssueType } from "../../models/issues/IssueType";
import { IssueComment } from "../../models/issues/IssueComment";
import { IssueCommentLocalRepository } from "../../repositories/local/issues/IssueCommentLocalRepository";
import IssueCommentRemoteRepository from "../../repositories/remote/issues/IssueCommentRemoteRepository";

const localRepository = new IssueCommentLocalRepository();
const remoteRepository = new IssueCommentRemoteRepository();

const issueCommentService = new BaseService<IssueComment>(localRepository, remoteRepository);

export async function fetchIssueCommentList(parentId: string): Promise<IssueComment[] | null> {
  try {
    console.log('parentIdCi',parentId)
    return await issueCommentService.getAll(parentId);
  } catch (error) {
    console.error('Error syncing issues comment:', error);
  }
}

export const issueCommentSyncable = {
  pushChanges: ({ changes, lastPulledAt }) =>
    issueCommentService.pushChanges({ changes, lastPulledAt }),
  pullChanges: ({ tableName, lastPulledAt }) => issueCommentService.pullChanges({ tableName, lastPulledAt }),
  tableName:  TABLE_NAMES.issueComment,
};

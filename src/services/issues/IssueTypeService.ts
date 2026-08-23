import { BaseService } from '../shared/BaseService';
import { TABLE_NAMES } from "../../migrations/tableName";
import { IssueTypeLocalRepository } from "../../repositories/local/issues/IssueTypeLocalRepository";
import IssueTypeRemoteRepository from "../../repositories/remote/issues/IssueTypeRemoteRepository";
import { IssueType } from "../../models/issues/IssueType";
import { Syncable } from '../shared/types';

const localRepository = new IssueTypeLocalRepository();
const remoteRepository = new IssueTypeRemoteRepository();

const issueTypeService = new BaseService<IssueType>(localRepository, remoteRepository);

export async function fetchIssueTypesList(): Promise<IssueType[] | null> {
  try {
    return await issueTypeService.getAll();
  } catch (error) {
    console.error('Error syncing issues type:', error);
  }
}

export const issueTypeSyncable: Syncable = {
  pushChanges: ({ changes, lastPulledAt }) =>
    issueTypeService.pushChanges({ changes, lastPulledAt }),
  pullChanges: ({ tableName, lastPulledAt }) => issueTypeService.pullChanges({ tableName, lastPulledAt }),
  tableName:  TABLE_NAMES.issueType,
};

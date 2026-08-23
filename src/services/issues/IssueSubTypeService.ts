import { BaseService } from '../shared/BaseService';
import { TABLE_NAMES } from "../../migrations/tableName";
import { IssueSubTypeLocalRepository } from "../../repositories/local/issues/IssueSubTypeLocalRepository";
import IssueSubTypeRemoteRepository from "../../repositories/remote/issues/IssueSubTypeRemoteRepository";
import { IssueSubType } from "../../models/issues/IssueSubType";
import { Syncable } from '../shared/types';

const localRepository = new IssueSubTypeLocalRepository();
const remoteRepository = new IssueSubTypeRemoteRepository();

const issueSubTypeService = new BaseService<IssueSubType>(localRepository, remoteRepository);

export async function fetchIssueSubTypesList(): Promise<IssueSubType[] | null> {
  try {
    return await issueSubTypeService.getAll();
  } catch (error) {
    console.error('Error syncing issues type:', error);
  }
}

export const issueSubTypeSyncable: Syncable = {
  pushChanges: ({ changes, lastPulledAt }) =>
    issueSubTypeService.pushChanges({ changes, lastPulledAt }),
  pullChanges: ({ tableName, lastPulledAt }) => issueSubTypeService.pullChanges({ tableName, lastPulledAt }),
  tableName:  TABLE_NAMES.issueSubType,
};

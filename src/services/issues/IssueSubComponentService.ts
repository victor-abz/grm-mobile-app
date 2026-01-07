import { BaseService } from '../shared/BaseService';
import { TABLE_NAMES } from "../../migrations/tableName";
import { IssueSubComponentLocalRepository } from "../../repositories/local/issues/IssueSubComponentLocalRepository";
import IssueSubComponentRemoteRepository from "../../repositories/remote/issues/IssueSubComponentRemoteRepository";
import { IssueSubComponent } from "../../models/issues/IssueSubComponent";
import { Syncable } from '../shared/types';

const localRepository = new IssueSubComponentLocalRepository();
const remoteRepository = new IssueSubComponentRemoteRepository();

const issueSubComponentService = new BaseService<IssueSubComponent>(localRepository, remoteRepository);

export async function fetchIssueSubComponentsList(): Promise<IssueSubComponent[] | null> {
  try {
    return await issueSubComponentService.getAll();
  } catch (error) {
    console.error('Error syncing issues type:', error);
  }
}

export const issueSubComponentSyncable: Syncable = {
  pushChanges: ({ changes, lastPulledAt }) =>
    issueSubComponentService.pushChanges({ changes, lastPulledAt }),
  pullChanges: ({ tableName, lastPulledAt }) => issueSubComponentService.pullChanges({ tableName, lastPulledAt }),
  tableName:  TABLE_NAMES.issueSubComponent,
};

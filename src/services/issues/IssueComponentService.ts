import { BaseService } from '../shared/BaseService';
import { TABLE_NAMES } from "../../migrations/tableName";
import { IssueComponentLocalRepository } from "../../repositories/local/issues/IssueComponentLocalRepository";
import IssueComponentRemoteRepository from "../../repositories/remote/issues/IssueComponentRemoteRepository";
import { IssueComponent } from "../../models/issues/IssueComponent";
import { Syncable } from '../shared/types';

const localRepository = new IssueComponentLocalRepository();
const remoteRepository = new IssueComponentRemoteRepository();

const issueComponentService = new BaseService<IssueComponent>(localRepository, remoteRepository);

export async function fetchIssueComponentsList(): Promise<IssueComponent[] | null> {
  try {
    return await issueComponentService.getAll();
  } catch (error) {
    console.error('Error syncing issues type:', error);
  }
}

export const issueComponentSyncable: Syncable = {
  pushChanges: ({ changes, lastPulledAt }) =>
    issueComponentService.pushChanges({ changes, lastPulledAt }),
  pullChanges: ({ tableName, lastPulledAt }) => issueComponentService.pullChanges({ tableName, lastPulledAt }),
  tableName:  TABLE_NAMES.issueComponent,
};

import IssueStatusRemoteRepository from '../../repositories/remote/issues/IssueStatusRemoteRepository';
import { BaseService } from '../shared/BaseService';
import {
  IssueStatusLocalRepository,
} from '../../repositories/local/issues/IssueStatusLocalRepository';
import { IssueStatus } from '../../models/issues/IssueStatus';
import { TABLE_NAMES } from "../../migrations/tableName";

const localRepository = new IssueStatusLocalRepository();
const remoteRepository = new IssueStatusRemoteRepository();

const issueStatusService = new BaseService<IssueStatus>(localRepository, remoteRepository);

export async function fetchIssueStatusList(): Promise<IssueStatus[] | null> {
  try {
    return await issueStatusService.getAll();
  } catch (error) {
    console.error('Error syncing issues statuses:', error);
  }
}

export const issueStatusSyncable = {
  pushChanges: ({ changes, lastPulledAt }) =>
    issueStatusService.pushChanges({ changes, lastPulledAt }),
  pullChanges: ({ lastPulledAt }) => issueStatusService.pullChanges({ lastPulledAt }),
  tableName:  TABLE_NAMES.issueStatus,
};

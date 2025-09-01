import { BaseService } from '../shared/BaseService';
import { IssueRemoteRepository } from '../../repositories/remote/issues/IssueRemoteRepository';
import {
  IssueLocalRepository,
} from '../../repositories/local/issues/IssueLocalRepository';
import { Issue } from '../../models/issues/Issue';
import { TABLE_NAMES } from "../../migrations/tableName";

const localRepository = new IssueLocalRepository();
const remoteRepository = new IssueRemoteRepository();

const issueService = new BaseService<Issue>(localRepository, remoteRepository);

export async function fetchIssueList(): Promise<Issue[] | null> {
  try {
    return await issueService.getAll();
  } catch (error) {
    console.error('Error syncing issues:', error);
  }
}

export const issueSyncable = {
  pushChanges: ({ changes, lastPulledAt }) => issueService.pushChanges({ changes, lastPulledAt }),
  pullChanges: ({ tableName, lastPulledAt }) => issueService.pullChanges({ tableName, lastPulledAt }),
  tableName:  TABLE_NAMES.issue,
};

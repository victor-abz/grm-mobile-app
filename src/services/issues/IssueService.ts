import { BaseService } from '../shared/BaseService';
import { IssueRemoteRepository } from '../../repositories/remote/issues/IssueRemoteRepository';
import { IssueLocalRepository } from '../../repositories/local/issues/IssueLocalRepository';
import { Issue } from '../../models/issues/Issue';
import { TABLE_NAMES } from '../../migrations/tableName';
import { Syncable } from '../shared/SyncService';

const localRepository = new IssueLocalRepository();
const remoteRepository = new IssueRemoteRepository();

const issueService = new BaseService<Issue>(localRepository, remoteRepository);

export async function fetchIssueList(endpointType: string): Promise<Issue[] | null> {
  try {
    const issueList = await issueService.getAll(
      null,
      endpointType,
      null,
      null,
      null,
      'updated_date',
      'asc'
    );

    return issueList;
  } catch (error) {
    console.error('Error syncing issues:', error);
  }
}

export async function createIssue(issue: Issue): Promise<Issue | null> {
  try {
    const newIssue = await issueService.upsert(issue);
    
    return newIssue;
  } catch (error) {
    console.error('Error syncing issues:', error);
  }
}

export async function updateIssue(issue: Issue): Promise<Issue | null> {
  try {
    const updatedIssue = await issueService.upsert(issue);
    console.log(updatedIssue);

    return updatedIssue;
  } catch (error) {
    console.error('Error Updating Issue:', error);
  }
}

export const reporterIssueListSyncable: Syncable = {
  pushChanges: ({ changes, lastPulledAt }) => issueService.pushChanges({ changes, lastPulledAt }),
  pullChanges: ({ tableName, lastPulledAt }) =>
    issueService.pullChanges({ tableName, lastPulledAt, endPointType: 'reporter', forceFetchAllPages: true }),
  tableName: TABLE_NAMES.issue,
};

export const assigneeIssueListSyncable: Syncable = {
  pushChanges: ({ changes, lastPulledAt }) => issueService.pushChanges({ changes, lastPulledAt }),
  pullChanges: ({ tableName, lastPulledAt }) =>
    issueService.pullChanges({ tableName, lastPulledAt, endPointType: 'assignee', forceFetchAllPages: true }),
  tableName: TABLE_NAMES.issue,
};

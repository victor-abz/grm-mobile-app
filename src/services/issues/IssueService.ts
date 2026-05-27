import { BaseService } from '../shared/BaseService';
import { OfflinePagingInitialTrackingInfo } from '../shared/types';
import { IssueRemoteRepository } from '../../repositories/remote/issues/IssueRemoteRepository';
import { IssueLocalRepository } from '../../repositories/local/issues/IssueLocalRepository';
import { Issue } from '../../models/issues/Issue';
import { TABLE_NAMES } from '../../migrations/tableName';
import { Syncable } from '../shared/types';
import { OfflinePaginatedListRequestControls } from '../shared/types';
import { LocalGetAllEventInfo } from '../../repositories/shared/BaseLocalRepository';

const localRepository = new IssueLocalRepository();
const remoteRepository = new IssueRemoteRepository();

const issueService = new BaseService<Issue>(localRepository, remoteRepository);

export async function fetchIssueList(endpointType: string, fetchAll: boolean = false, extraQueries: any[] | null = null, searchTerm: string | null = null): Promise<Issue[] | null> {
  try {
    const issueList = await issueService.getAll(
      null,
      endpointType,
      null,
      null,
      fetchAll,
      'intake_date',
      'desc',
      extraQueries,
      searchTerm,
    );
    return issueList;
  } catch (error) {
    console.error('Error syncing issues:', error);
  }
}

export async function fetchMoreIssueList(
  endpointType: string,
  offlinePaginatedListControlsRequest: OfflinePaginatedListRequestControls,
  offlinePagingInitialTrackingInfo?: OfflinePagingInitialTrackingInfo<Issue>,
  extraQueries: any[] | null = null
): Promise<{
  event: LocalGetAllEventInfo | undefined;
  results: Issue[];
} | null> {
  try {
    const issueList = await issueService.getMore(
      endpointType,
      offlinePaginatedListControlsRequest,
      offlinePagingInitialTrackingInfo,
      false,
      extraQueries,
    );
    return issueList;
  } catch (error) {
    console.error('Error fetching more issues. Reason: ', error);
  }
}

export async function createIssue(issue: Issue): Promise<Issue | null> {
  try {
    const newIssue: any = await issueService.upsert(issue);
    return newIssue;
  } catch (error) {
    console.error('Error creating Issue:', error);
  }
}

export async function updateIssue(issue: Issue): Promise<Issue | null> {
  try {
    const updatedIssue: any = await issueService.upsert(issue);
    return updatedIssue;
  } catch (error) {
    console.error('Error Updating Issue:', error);
  }
}

export const reporterIssueListSyncable: Syncable = {
  pushChanges: ({ changes, lastPulledAt }) => issueService.pushChanges({ changes, lastPulledAt }),
  pullChanges: ({ tableName, lastPulledAt }) =>
    issueService.pullChanges({
      tableName,
      lastPulledAt,
      endPointType: 'reporter',
      forceFetchAllPages: true,
    }),
  tableName: TABLE_NAMES.issue,
};

export const assigneeIssueListSyncable: Syncable = {
  pushChanges: ({ changes, lastPulledAt }) => new Promise((res, reject) => res()),
  pullChanges: ({ tableName, lastPulledAt }) =>
    issueService.pullChanges({
      tableName,
      lastPulledAt,
      endPointType: 'assignee',
      forceFetchAllPages: true,
    }),
  tableName: TABLE_NAMES.issue,
};

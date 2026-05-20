import { BaseService, CreatedResponseWithBackendId, WatermelonId } from '../shared/BaseService';
import { TABLE_NAMES } from "../../migrations/tableName";
import { IssueComment } from "../../models/issues/IssueComment";
import { IssueCommentLocalRepository } from "../../repositories/local/issues/IssueCommentLocalRepository";
import IssueCommentRemoteRepository from "../../repositories/remote/issues/IssueCommentRemoteRepository";
import { SyncStatus } from '@nozbe/watermelondb/Model';
import type {
  OfflinePagingInitialTrackingInfo,
  OfflinePaginatedListRequestControls,
  Syncable
} from '../shared/types';
import { LocalGetAllEventInfo } from '../../repositories/shared/BaseLocalRepository';

const localRepository = new IssueCommentLocalRepository();
const remoteRepository = new IssueCommentRemoteRepository();

const issueCommentService = new BaseService<IssueComment>(localRepository, remoteRepository);

export async function fetchIssueCommentList(
  parentId: string,
  page: number | null = null,
  limit: number | null = null
): Promise<IssueComment[] | null> {
  try {
    return await issueCommentService.getAll(
      parentId,
      null,
      null,
      page,
      null,
      null,
      null
    );
  } catch (error) {
    console.error('Error syncing issues comment:', error);
  }
}

// export async function fetchMoreIssueCommentList(
//   endpointType: string,
//   offlinePaginatedListControlsRequest: OfflinePaginatedListRequestControls,
//   offlinePagingInitialTrackingInfo?: OfflinePagingInitialTrackingInfo<IssueComment>
// ): Promise<{
//   event: LocalGetAllEventInfo | undefined;
//   results: IssueComment[];
// } | null> {
//   try {
//     const issueCommentsList = await issueCommentService.getMore(
//       endpointType,
//       offlinePaginatedListControlsRequest,
//       offlinePagingInitialTrackingInfo
//     );
//     return issueCommentsList;
//   } catch (error) {
//     console.error('Error fetching more issues. Reason: ', error);
//   }
// }

export async function createIssueComment(issueComment: IssueComment): Promise<IssueComment | null> {
  try {
    const createdComment: any = await issueCommentService.upsert(issueComment as any);
    return createdComment
  } catch (error) {
    console.error('Error creating issue comment:', error);
  }
}

export const issueCommentSyncable: Syncable = {
  pushChanges: ({ changes, lastPulledAt }) =>
    issueCommentService.pushChanges({ changes, lastPulledAt }),
  pullChanges: ({ tableName, lastPulledAt, forceFetchAllPages, parentChanges }) =>
    issueCommentService.pullChanges({ tableName, lastPulledAt, forceFetchAllPages, parentChanges  }),
  tableName: TABLE_NAMES.issueComment,
  replaceParentIds: (
    idsToReplace: [CreatedResponseWithBackendId, WatermelonId][],
    status?: SyncStatus
  ) =>
    issueCommentService.replaceParentIdProperty(idsToReplace as any, status) as any,
};

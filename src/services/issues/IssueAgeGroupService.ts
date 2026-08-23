import { BaseService } from '../shared/BaseService';
import IssueAgeGroupRemoteRepository from '../../repositories/remote/issues/IssueAgeGroupRemoteRepository';
import {
  IssueAgeGroupLocalRepository,
} from '../../repositories/local/issues/IssueAgeGroupLocalRepository';
import { IssueAgeGroup } from '../../models/issues/IssueAgeGroup';
import { TABLE_NAMES } from "../../migrations/tableName";
import { Syncable } from '../shared/types';

const localRepository = new IssueAgeGroupLocalRepository();
const remoteRepository = new IssueAgeGroupRemoteRepository();

const issueAgeGroupService = new BaseService<IssueAgeGroup>(localRepository, remoteRepository);

export async function fetchIssueAgeGroupList(): Promise<IssueAgeGroup[] | null> {
  try {
    const issueAgeGroupList = await issueAgeGroupService.getAll();
    return issueAgeGroupList;
  } catch (error) {
    console.error('Error syncing issueAgeGroups:', error);
  }
}

export const issueAgeGroupListSyncable: Syncable = {
  pushChanges: ({ changes, lastPulledAt }) => issueAgeGroupService.pushChanges({ changes, lastPulledAt }),
  pullChanges: ({ tableName, lastPulledAt }) => issueAgeGroupService.pullChanges({ tableName, lastPulledAt }),
  tableName:  TABLE_NAMES.issueAgeGroup,
};

import { BaseService } from '../shared/BaseService';
import IssueAgeGroupRemoteRepository from '../../repositories/remote/issues/IssueAgeGroupRemoteRepository';
import {
  IssueAgeGroupLocalRepository,
} from '../../repositories/local/issueAgeGroups/IssueAgeGroupLocalRepository';
import { IssueAgeGroup } from '../../models/issueAgeGroups/IssueAgeGroup';
import { TABLE_NAMES } from "../../migrations/tableName";
import { Syncable } from '../shared/SyncService';

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

export async function createIssueAgeGroup(issueAgeGroup: IssueAgeGroup): Promise<IssueAgeGroup | null> {
  try {
    const newIssueAgeGroup = await issueAgeGroupService.upsert(issueAgeGroup)
    console.log(newIssueAgeGroup);
    
    return null
  } catch (error) {
    console.error('Error syncing issueAgeGroups:', error);
  }
}

export async function updateIssueAgeGroup(issueAgeGroup: IssueAgeGroup): Promise<IssueAgeGroup | null> {
  try {
    const updatedIssueAgeGroup = await issueAgeGroupService.upsert(issueAgeGroup)
    console.log(updatedIssueAgeGroup);
    
    return updatedIssueAgeGroup;
  } catch (error) {
    console.error('Error Updating IssueAgeGroup:', error);
  }
}

export const issueAgeGroupListSyncable: Syncable = {
  pushChanges: ({ changes, lastPulledAt }) => issueAgeGroupService.pushChanges({ changes, lastPulledAt }),
  pullChanges: ({ tableName, lastPulledAt }) => issueAgeGroupService.pullChanges({ tableName, lastPulledAt }),
  tableName:  TABLE_NAMES.issueAgeGroup,
};

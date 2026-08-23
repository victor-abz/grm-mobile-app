import { BaseService } from '../shared/BaseService';
import IssueCitizenGroupRemoteRepository from '../../repositories/remote/issues/IssueCitizenGroupRemoteRepository';
import {
  IssueCitizenGroupLocalRepository,
} from '../../repositories/local/issues/IssueCitizenGroupLocalRepository';
import { IssueCitizenGroup } from '../../models/issues/IssueCitizenGroup';
import { TABLE_NAMES } from "../../migrations/tableName";
import { Syncable } from '../shared/types';

const localRepository = new IssueCitizenGroupLocalRepository();
const remoteRepository = new IssueCitizenGroupRemoteRepository();

const issueCitizenGroupService = new BaseService<IssueCitizenGroup>(localRepository, remoteRepository);

export async function fetchIssueCitizenGroupList(): Promise<IssueCitizenGroup[] | null> {
  try {
    const issueCitizenGroupList = await issueCitizenGroupService.getAll();
    return issueCitizenGroupList;
  } catch (error) {
    console.error('Error syncing issueCitizenGroups:', error);
  }
}

export const issueCitizenGroupListSyncable: Syncable = {
  pushChanges: ({ changes, lastPulledAt }) => issueCitizenGroupService.pushChanges({ changes, lastPulledAt }),
  pullChanges: ({ tableName, lastPulledAt }) => issueCitizenGroupService.pullChanges({ tableName, lastPulledAt }),
  tableName:  TABLE_NAMES.issueCitizenGroup,
};

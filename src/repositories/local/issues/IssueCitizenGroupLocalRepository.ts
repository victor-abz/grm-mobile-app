import { RawRecord } from '@nozbe/watermelondb';
import { TABLE_NAMES } from "../../../migrations/tableName";
import { IssueCitizenGroup, IssueCitizenGroupLocalModel } from "../../../models/issues/IssueCitizenGroup";
import { BaseLocalRepository } from '../../shared/BaseLocalRepository';

export class IssueCitizenGroupLocalRepository extends BaseLocalRepository<IssueCitizenGroup> {
  constructor() {
    super(TABLE_NAMES.issueCitizenGroup);
  }

  fromRemoteToLocal(issueCitizenGroup: any): RawRecord {    
    const raw = {
      ...issueCitizenGroup,
    };
    return raw
  }

  fromLocalToRemote(localModel: IssueCitizenGroupLocalModel): IssueCitizenGroup {
    return {
      id: localModel.id,
      name: localModel.name,
      type: localModel.type,
      created_date: localModel.created_date,
      updated_date: localModel.updated_date,
    };
  }
}

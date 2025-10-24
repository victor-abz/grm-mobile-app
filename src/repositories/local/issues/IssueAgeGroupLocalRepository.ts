import { RawRecord } from '@nozbe/watermelondb';
import { TABLE_NAMES } from "../../../migrations/tableName";
import { IssueAgeGroup, IssueAgeGroupLocalModel } from "../../../models/issues/IssueAgeGroup";
import { BaseLocalRepository } from '../../shared/BaseLocalRepository';

export class IssueAgeGroupLocalRepository extends BaseLocalRepository<IssueAgeGroup> {
  constructor() {
    super(TABLE_NAMES.issueAgeGroup);
  }

  fromRemoteToLocal(issueAgeGroup: any): RawRecord {    
    const raw = {
      ...issueAgeGroup,
    };
    return raw
  }

  fromLocalToRemote(localModel: IssueAgeGroupLocalModel): IssueAgeGroup {
    return {
      id: localModel.id,
      name: localModel.name,
      created_date: localModel.created_date,
    };
  }
}

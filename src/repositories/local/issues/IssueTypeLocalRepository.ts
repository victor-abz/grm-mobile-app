import { RawRecord } from '@nozbe/watermelondb';
import { TABLE_NAMES } from "../../../migrations/tableName";
import { IssueType, IssueTypeLocalModel } from "../../../models/issues/IssueType";
import { BaseLocalRepository } from '../../shared/BaseLocalRepository';

export class IssueTypeLocalRepository extends BaseLocalRepository<IssueType> {
  constructor() {
    super(TABLE_NAMES.issueType);
  }

  fromRemoteToLocal(issueType: any): RawRecord {
    
    const raw = {
      ...issueType,
    };
    return raw
  }

  fromLocalToRemote(localModel: IssueTypeLocalModel): IssueType {
    return {
      id: localModel.id,
      name: localModel.name,
      created_date: localModel.created_date,
    };
  }
}

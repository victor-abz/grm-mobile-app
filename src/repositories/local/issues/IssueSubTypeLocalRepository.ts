import { BaseLocalRepository } from '../../shared/BaseLocalRepository';
import { TABLE_NAMES } from "../../../migrations/tableName";
import { IssueSubType, IssueSubTypeLocalModel } from "../../../models/issues/IssueSubType";
import { RawRecord } from '@nozbe/watermelondb';

export class IssueSubTypeLocalRepository extends BaseLocalRepository<IssueSubType> {
  constructor() {
    super(TABLE_NAMES.issueSubType);
  }

  fromRemoteToLocal(issueSubType: any): RawRecord {
    
    const raw = {
      ...issueSubType,
    };
    return raw
  }

  fromLocalToRemote(localModel: IssueSubTypeLocalModel): IssueSubType {
    return {
      id: localModel.id,
      name: localModel.name,
      created_date: localModel.created_date,
      parent: localModel.parent,
    };
  }
}

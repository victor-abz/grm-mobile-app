import { BaseLocalRepository } from '../../shared/BaseLocalRepository';
import { TABLE_NAMES } from "../../../migrations/tableName";
import { IssueSubComponent, IssueSubComponentLocalModel } from "../../../models/issues/IssueSubComponent";
import { RawRecord } from '@nozbe/watermelondb';

export class IssueSubComponentLocalRepository extends BaseLocalRepository<IssueSubComponent> {
  constructor() {
    super(TABLE_NAMES.issueSubComponent);
  }

  fromRemoteToLocal(issueSubComponent: any): RawRecord {
    
    const raw = {
      ...issueSubComponent,
    };
    return raw
  }

  fromLocalToRemote(localModel: IssueSubComponentLocalModel): IssueSubComponent {
    return {
      id: localModel.id,
      name: localModel.name,
      created_date: localModel.created_date,
      parent: localModel.parent,
      description: localModel.description
    };
  }
}

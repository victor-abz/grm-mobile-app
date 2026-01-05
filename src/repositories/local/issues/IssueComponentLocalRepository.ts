import { BaseLocalRepository } from '../../shared/BaseLocalRepository';
import { TABLE_NAMES } from "../../../migrations/tableName";
import { IssueComponent, IssueComponentLocalModel } from "../../../models/issues/IssueComponent";
import { RawRecord } from '@nozbe/watermelondb';

export class IssueComponentLocalRepository extends BaseLocalRepository<IssueComponent> {
  constructor() {
    super(TABLE_NAMES.issueComponent);
  }

  fromRemoteToLocal(issueComponent: any): RawRecord {
    
    const raw = {
      ...issueComponent,
    };
    return raw
  }

  fromLocalToRemote(localModel: IssueComponentLocalModel): IssueComponent {
    return {
      id: localModel.id,
      name: localModel.name,
      created_date: localModel.created_date,
      description: localModel.description
    };
  }
}

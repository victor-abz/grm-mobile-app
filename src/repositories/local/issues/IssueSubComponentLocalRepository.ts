import { BaseLocalRepository } from '../../shared/BaseLocalRepository';
import { TABLE_NAMES } from "../../../migrations/tableName";
import { IssueSubComponent, IssueSubComponentLocalModel } from "../../../models/issues/IssueSubComponent";

export class IssueSubComponentLocalRepository extends BaseLocalRepository<IssueSubComponent> {
  constructor() {
    super(TABLE_NAMES.issueSubComponent);
  }

  fromRemoteToLocal(issueSubComponent: any): any {
    if (issueSubComponent && typeof issueSubComponent === 'object') {
      const i = issueSubComponent as Record<string, any>;

      return {
        ...i,
        parent: typeof i.parent === 'object' ? JSON.stringify(i.parent) : i.parent,
      };
    }
    return null;
  }

  fromLocalToRemote(localModel: IssueSubComponentLocalModel): IssueSubComponent {
    return {
      id: localModel.id,
      name: localModel.name,
      created_date: localModel.created_date,
      updated_date: localModel.updated_date,
      parent: localModel.parent,
      description: localModel.description,
    };
  }
}

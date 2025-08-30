import { BaseLocalRepository } from '../../shared/BaseLocalRepository';
import { TABLE_NAMES } from "../../../migrations/tableName";
import { IssueType, IssueTypeLocalModel } from "../../../models/issues/IssueType";

export class IssueTypeLocalRepository extends BaseLocalRepository<IssueType> {
  constructor() {
    super(TABLE_NAMES.issueType);
  }

  fromLocalToRemote(localModel: IssueTypeLocalModel): IssueType {
    return {
      id: localModel.id,
      name: localModel.name,
      created_date: localModel.created_date
    };
  }
}

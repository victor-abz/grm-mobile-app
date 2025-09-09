import { BaseLocalRepository } from '../../shared/BaseLocalRepository';
import { IssueStatus, IssueStatusLocalModel } from '../../../models/issues/IssueStatus';
import { TABLE_NAMES } from "../../../migrations/tableName";

export class IssueStatusLocalRepository extends BaseLocalRepository<IssueStatus> {
  constructor() {
    super(TABLE_NAMES.issueStatus);
  }

  fromLocalToRemote(localModel: IssueStatusLocalModel): IssueStatus {
    return {
      id: String(localModel.id).replace(/[^a-zA-Z0-9-]/g, ''),
      name: localModel.name,
      created_date: localModel.created_date,
      final_status: localModel.final_status,
      initial_status: localModel.initial_status,
      rejected_status: localModel.rejected_status,
      open_status: localModel.open_status,
    };
  }
}

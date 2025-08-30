import { IssueCategory, IssueCategoryLocalModel } from "../../../models/issues/IssueCategory";
import { TABLE_NAMES } from "../../../migrations/tableName";
import { BaseLocalRepository } from "../../shared/BaseLocalRepository";

export class IssueCategoryLocalRepository extends BaseLocalRepository<IssueCategory> {
  constructor() {
    super(TABLE_NAMES.issueCategory);
  }

  fromLocalToRemote(localModel: IssueCategoryLocalModel): IssueCategory {
    return {
      id: localModel.id,
      name: localModel.name,
      abbreviation: localModel.abbreviation,
      assigned_department: localModel.assigned_department,
      assigned_appeal_department: localModel.assigned_appeal_department,
      assigned_escalation_department: localModel.assigned_escalation_department,
      confidentiality_level: localModel.confidentiality_level,
      created_date: localModel.created_date,
      redirection_protocol: localModel.redirection_protocol,
      label: localModel.label,
      value: localModel.value,
    };
  }
}

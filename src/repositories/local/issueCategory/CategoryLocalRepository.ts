import { BaseLocalRepository, Mapper } from "../BaseLocalRepository";
import { IssueCategory } from "../../../models/IssueCategory";

export const mapper: Mapper<IssueCategory> = {
    toModel: (row: any): IssueCategory => ({
        id: row.id,
        name: row.name,
        abbreviation: row.abbreviation,
        assigned_department: JSON.parse(row.assigned_department),
        assigned_appeal_department: JSON.parse(row.assigned_appeal_department),
        assigned_escalation_department: JSON.parse(row.assigned_escalation_department),
        confidentiality_level: row.confidentiality_level,
        redirection_protocol: row.redirection_protocol,
        label: row.label,
        value: row.value,
        created_date: row.created_date,
        deleted_date: row.deleted_date,
        sync_date: row.sync_date,
        updated_date: row.updated_date,
    }),
    toRow: (model: IssueCategory) => ({ 
        id: model.id,
        name: model.name,
        abbreviation: model.abbreviation,
        assigned_department: JSON.stringify(model.assigned_department),
        assigned_appeal_department: JSON.stringify(model.assigned_appeal_department),
        assigned_escalation_department: JSON.stringify(model.assigned_escalation_department),
        confidentiality_level: model.confidentiality_level,
        redirection_protocol: model.redirection_protocol,
        label: model.label,
        value: model.value,
        deleted_at: model.deleted_date ?? null,
        updated_at: model.updated_date ?? new Date().toISOString(),
        sync_at: model.sync_date ?? null,
    })
}

export class CategoryLocalRepository extends BaseLocalRepository<IssueCategory> {
  constructor() {
    super('issue_category', 'id', 'updated_at', 'sync_at', mapper);
  }
}
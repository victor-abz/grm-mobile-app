import { BaseLocalRepository, Exact, Mapper, Schema } from "../BaseLocalRepository";
import { IssueCategory } from "../../../models/IssueCategory";
import { issueCategoryTableSchema } from "../../../migrations/v1/issue_category";

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
        created_at: row.created_at,
        deleted_at: row.deleted_at,
        sync_at: row.sync_at,
        updated_at: row.updated_at,
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
        deleted_at: model.deleted_at ?? null,
        updated_at: model.updated_at ?? new Date().toISOString(),
        sync_at: model.sync_at ?? null,
    })
}

const issueCategorySchema: Exact<Schema<IssueCategory>, typeof issueCategoryTableSchema> = issueCategoryTableSchema;

export class IssueCategoryLocalRepository extends BaseLocalRepository<IssueCategory> {
  constructor() {
    super('issue_category', 'id', 'updated_at', 'sync_at', mapper, issueCategorySchema);
  }
}
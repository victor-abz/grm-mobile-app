import { BaseLocalRepository, Exact, Mapper, Schema } from "../BaseLocalRepository";
import type { IssueType } from "../../../models/IssueType";
import { issueTypeTableSchema } from "../../../migrations/v1/issue_type";

export const mapper: Mapper<IssueType> = {
    toModel: (row: any): IssueType => ({
        id: row.id,
        name: row.name,
        created_at: row.created_at,
        deleted_at: row.deleted_at,
        sync_at: row.sync_at,
        updated_at: row.updated_at,
    }),
    toRow: (model: IssueType) => ({ 
        id: model.id,
        name: model.name,
        deleted_at: model.deleted_at ?? null,
        updated_at: model.updated_at ?? new Date().toISOString(),
        sync_at: model.sync_at ?? null,
    })
}

const issueTypeSchema: Exact<Schema<IssueType>, typeof issueTypeTableSchema> = issueTypeTableSchema;

export class IssueTypeLocalRepository extends BaseLocalRepository<IssueType> {
  constructor() {
    super('issue_type', 'id', 'updated_at', 'sync_at', mapper, issueTypeSchema);
  }
}
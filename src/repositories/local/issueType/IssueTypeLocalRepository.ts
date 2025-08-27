import { BaseLocalRepository, Exact, Mapper, Schema } from "../BaseLocalRepository";
import type { IssueType } from "../../../models/IssueType";
import { issueTypeTableSchema } from "../../../migrations/v1/issue_type";

export const mapper: Mapper<IssueType> = {
  toModel: (row: any): IssueType => ({
    id: row.id,
    name: row.name,
    created_date: row.created_date,
    deleted_at: row.deleted_at,
    sync_at: row.sync_at,
    updated_at: row.updated_at,
  }),
  toRow: (model: IssueType) => ({
    id: model.id,
    name: model.name,
    created_date: model.created_date,
    deleted_at: model.deleted_at ?? null,
    updated_at: model.updated_at ?? new Date().toISOString(),
    sync_at: model.sync_at ?? null,
  })
}


export class IssueTypeLocalRepository extends BaseLocalRepository<IssueType> {
  constructor() {
    super('issue_type', 'id', 'updated_at', 'sync_at', mapper, issueTypeTableSchema);
  }
}

import { BaseLocalRepository, Mapper } from "../BaseLocalRepository";
import type { IssueType } from "../../../models/IssueType";
import { issueTypeTableSchema } from "../../../migrations/v1/issue_type";

export const mapper: Mapper<IssueType> = {
  toModel: (row: any): IssueType => ({
    id: row.id,
    name: row.name,
    created_date: row.created_date,
    deleted_date: row.deleted_date,
    sync_date: row.sync_date,
    updated_date: row.updated_date,
  }),
  toRow: (model: IssueType) => ({
    id: model.id,
    name: model.name,
    created_date: model.created_date,
    deleted_date: model.deleted_date ?? null,
    updated_date: model.updated_date ?? new Date().toISOString(),
    sync_date: model.sync_date ?? null,
  })
}


export class IssueTypeLocalRepository extends BaseLocalRepository<IssueType> {
  constructor() {
    super('issue_type', 'id', 'updated_date', 'sync_date', mapper, issueTypeTableSchema);
  }
}

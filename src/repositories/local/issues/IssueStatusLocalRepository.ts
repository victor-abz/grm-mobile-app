import { BaseLocalRepository, Mapper } from "../BaseLocalRepository";
import { IssueStatus } from "../../../models/IssueStatus";
import { issueStatusTableSchema } from "../../../migrations/v1/issue_status";


export const mapper: Mapper<IssueStatus> = {
  toModel: (row) => ({
    id: row.id,
    name: row.name,
    final_status: row.final_status,
    initial_status: row.initial_status,
    rejected_status: row.rejected_status,
    open_status: row.open_status,
    created_date: row.created_date,
    deleted_at: row.deleted_at,
    sync_at: row.sync_at,
    updated_at: row.updated_at,
  }),
  toRow: (model: IssueStatus) => ({
    id: model.id,
    name: model.name,
    final_status: model.final_status,
    initial_status: model.initial_status,
    rejected_status: model.rejected_status,
    open_status: model.open_status,
    created_date: model.created_date ?? new Date().toISOString(),
    deleted_date: model.deleted_date ?? null,
    updated_date: model.updated_date ?? new Date().toISOString(),
    sync_date: model.sync_date ?? null,
  })
};

export class IssueStatusLocalRepository extends BaseLocalRepository<IssueStatus> {
  constructor() {
    super('issue_status', 'id', 'updated_date', 'sync_date', mapper, issueStatusTableSchema);
  }
}


import { BaseLocalRepository, Exact, Mapper, Schema } from "../BaseLocalRepository";
import type { IssueStatus } from "../../../models/IssueStatus";
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
    deleted_at: model.deleted_at ?? null,
    updated_at: model.updated_at ?? new Date().toISOString(),
    sync_at: model.sync_at ?? null,
  })
};


export class IssueStatusLocalRepository extends BaseLocalRepository<IssueStatus> {
  constructor() {
    super('issue_status', 'id', 'updated_at', 'sync_at', mapper, issueStatusTableSchema);
  }
}


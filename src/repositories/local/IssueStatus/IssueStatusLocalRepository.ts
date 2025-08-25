import { BaseLocalRepository, Exact, Mapper, Schema } from "../BaseLocalRepository";
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
        deleted_date: row.deleted_date,
        sync_date: row.sync_date,
        updated_date: row.updated_date,
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

const issueStatusSchema: Exact<Schema<IssueStatus>, typeof issueStatusTableSchema> = issueStatusTableSchema;

export class IssueStatusLocalRepository extends BaseLocalRepository<IssueStatus> {
  constructor() {
    super('issue_status', 'id', 'updated_at', 'sync_at', mapper, issueStatusSchema);
  }
}


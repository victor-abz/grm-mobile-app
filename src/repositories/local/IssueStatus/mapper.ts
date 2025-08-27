import { Mapper } from "../BaseLocalRepository";
import { IssueStatus } from "../../../models/IssueStatus";

export const mapper: Mapper<IssueStatus> = {
  toModel: (row) =>
    ({
      id: row.id,
      name: row.name,
      final_status: row.final_status,
      initial_status: row.initial_status,
      rejected_status: row.rejected_status,
      open_status: row.open_status,
      created_date: row.created_date,
      updated_at: row.updated_at,
      sync_at: row.sync_at,
      deleted_at: row.deleted_at
    }),
  toRow: (model: IssueStatus) => ({
    id: model.id,
    name: model.name,
    final_status: model.final_status,
    initial_status: model.initial_status,
    rejected_status: model.rejected_status,
    open_status: model.open_status,
    created_date: model.created_date ?? null,
    deleted_at: model.deleted_at ?? null,
    updated_at: model.updated_at ?? new Date().toISOString(),
    sync_at: model.sync_at ?? null,
  })
};

import { Mapper } from "../BaseLocalRepository";
import { IssueStatus } from "../../../models/issue_status";

export const mapper: Mapper<IssueStatus> = {
    toModel: (row) => {return ({
        _id: row._id,
        _rev: row._rev,
        id: row.id,
        name: row.name,
        final_status: row.final_status,
        initial_status: row.initial_status,
        rejected_status: row.rejected_status,
        open_status: row.open_status,
    })},
    toRow: (model: IssueStatus) => ({
        id: model.id,
        name: model.name,
        final_status: model.final_status,
        initial_status: model.initial_status,
        rejected_status: model.rejected_status,
        open_status: model.open_status,
        updated_at: null, //
        sync_at: null,
        deleted_at: null,
    })
};
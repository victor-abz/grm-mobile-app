import { issue } from "../../../migrations/v1/issue";
import { Issue } from "../../../models/Issue";
import { BaseLocalRepository, Mapper } from "../BaseLocalRepository";


const mapper: Mapper<Issue> = {
  toModel: (row: any): Issue => ({
    id: row.id,
    administrative_region: JSON.parse(row.administrative_region),
    assignee: JSON.parse(row.assignee),
    attachments: JSON.parse(row.attachments) ?? [],
    auto_increment_id: row.auto_increment_id,
    category: JSON.parse(row.category),
    citizen: JSON.parse(row.citizen),
    component: JSON.parse(row.component),
    confirmed: row.confirmed === 1,
    contact_medium: row.contact_medium,
    contact_information: JSON.parse(row.contact_information),
    contact_method: row.contact_method,
    created_date: row.created_date,
    deleted_at: row.deleted_at,
    description: row.description,
    intake_date: new Date(row.intake_date),
    issue_date: row.issue_date ? new Date(row.issue_date) : null,
    issue_location_id: row.issue_location_id,
    issue_sub_type: row.issue_sub_type,
    issue_type: row.issue_type,
    internal_code: row.internal_code,
    location_description: row.location_description,
    name: row.name,
    ongoing_issue: row.ongoing_issue === 1,
    reporter: JSON.parse(row.reporter),
    resolution_date: row.resolution_at ? new Date(row.resolution_at) : null,
    title: row.title,
    tracking_code: row.tracking_code,
    sub_component: row.sub_component.id,
    status: JSON.parse(row.status),
    updated_at: row.updated_at,
    sync_at: row.sync_at
  }),

  toRow: (model: Issue) => ({
    id: model.id,
    administrative_region: JSON.stringify(model.administrative_region),
    assignee: JSON.stringify(model.assignee),
    attachments: JSON.stringify(model.attachments ?? []),
    auto_increment_id: model.auto_increment_id,
    category: JSON.stringify(model.category),
    citizen: JSON.stringify(model.citizen),
    component: JSON.stringify(model.component),
    confirmed: model.confirmed ? 1 : 0,
    contact_medium: model.contact_medium,
    contact_information: JSON.stringify(model.contact_information),
    contact_method: model.contact_method,
    created_date: model.created_date,
    description: model.description,
    deleted_date: model.deleted_date ?? null,
    intake_date: model.intake_date,
    issue_date: model.issue_date ? model.issue_date : null,
    issue_location_id: model.issue_location_id,
    issue_sub_type: model.issue_sub_type,
    issue_type: model.issue_type,
    internal_code: model.internal_code,
    location_description: model.location_description,
    ongoing_issue: model.ongoing_issue ? 1 : 0,
    reporter: JSON.stringify(model.reporter),
    resolution_date: model.resolution_date ? model.resolution_date : null,
    title: model.title,
    tracking_code: model.tracking_code,
    sub_component_id: model.sub_component.id,
    status: JSON.stringify(model.status),
    updated_date: model.updated_date ?? new Date().toISOString(),
    sync_date: model.sync_date ?? null,
  }),
};


export class IssueLocalRepository extends BaseLocalRepository<Issue> {
  constructor() {
    super('issues', 'id', 'updated_date', 'sync_date', mapper, issue);
  }
}

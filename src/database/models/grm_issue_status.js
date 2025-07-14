import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class GrmIssueStatus extends Model {
  static table = 'grm_issue_statuses';

  @field('status_name') statusName;

  @field('final_status') finalStatus;

  @field('initial_status') initialStatus;

  @field('rejected_status') rejectedStatus;

  @field('open_status') openStatus;

  // Add Frappe sync timestamp fields
  @date('creation') creation;

  @date('modified') modified;

  @date('created_at') createdAt;

  @date('updated_at') updatedAt;
}

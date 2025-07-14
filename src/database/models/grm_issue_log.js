import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class GrmIssueLog extends Model {
  static table = 'grm_issue_logs';

  static associations = {
    grm_issues: { type: 'belongs_to', key: 'grm_issue' },
  };

  @field('text') text;

  @date('timestamp') timestamp;

  // New action tracking fields
  @field('action_taken') actionTaken;

  @date('action_taken_date') actionTakenDate;

  // Add Frappe sync timestamp fields
  @date('creation') creation;

  @date('modified') modified;

  @date('created_at') createdAt;

  @date('updated_at') updatedAt;

  @field('grm_issue') grmIssue;

  @field('user') user;

  @field('action_taken_by') actionTakenBy;
}

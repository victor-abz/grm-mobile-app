import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class GrmIssueEscalationReason extends Model {
  static table = 'grm_issue_escalation_reasons';
  static associations = {
    grm_issues: { type: 'belongs_to', key: 'grm_issue' },
  };

  @field('comment') comment;
  @date('due_at') dueAt;

  // Add Frappe sync timestamp fields
  @date('creation') creation;
  @date('modified') modified;

  @date('created_at') createdAt;
  @date('updated_at') updatedAt;

  @field('grm_issue') grmIssue;
  @field('user') user;
}

import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class GrmIssueCategory extends Model {
  static table = 'grm_issue_categories';

  @field('category_name') categoryName;
  @field('label') label;
  @field('abbreviation') abbreviation;
  @field('assigned_department') assignedDepartment;
  @field('assigned_appeal_department') assignedAppealDepartment;
  @field('assigned_escalation_department') assignedEscalationDepartment;
  @field('confidentiality_level') confidentialityLevel;
  @field('redirection_protocol') redirectionProtocol;
  @field('administrative_level') administrativeLevel;

  // Add Frappe sync timestamp fields
  @date('creation') creation;
  @date('modified') modified;

  @date('created_at') createdAt;
  @date('updated_at') updatedAt;
}

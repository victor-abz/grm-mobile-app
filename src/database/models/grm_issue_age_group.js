import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class GrmIssueAgeGroup extends Model {
  static table = 'grm_issue_age_groups';

  @field('age_group') ageGroup;

  // Add Frappe sync timestamp fields
  @date('creation') creation;

  @date('modified') modified;

  @date('created_at') createdAt;

  @date('updated_at') updatedAt;
}

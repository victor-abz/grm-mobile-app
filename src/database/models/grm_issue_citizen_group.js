import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class GrmIssueCitizenGroup extends Model {
  static table = 'grm_issue_citizen_groups';

  @field('group_name') groupName;
  @field('group_type') groupType;

  // Add Frappe sync timestamp fields
  @date('creation') creation;
  @date('modified') modified;

  @date('created_at') createdAt;
  @date('updated_at') updatedAt;
}

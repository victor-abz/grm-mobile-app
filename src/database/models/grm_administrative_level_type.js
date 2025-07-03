import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class GrmAdministrativeLevelType extends Model {
  static table = 'grm_administrative_level_types';

  @field('level_name') levelName;
  @field('level_order') levelOrder;
  @field('project') project;

  // Add Frappe sync timestamp fields
  @date('creation') creation;
  @date('modified') modified;

  @date('created_at') createdAt;
  @date('updated_at') updatedAt;
}

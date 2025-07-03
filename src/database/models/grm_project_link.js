import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class GrmProjectLink extends Model {
  static table = 'grm_project_links';

  @field('parent') parent;
  @field('parenttype') parentType;
  @field('project') project;

  // Add Frappe sync timestamp fields
  @date('creation') creation;
  @date('modified') modified;

  @date('created_at') createdAt;
  @date('updated_at') updatedAt;

}

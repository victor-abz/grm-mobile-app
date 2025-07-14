import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class GrmAdministrativeRegion extends Model {
  static table = 'grm_administrative_regions';

  static associations = {
    grm_administrative_regions: { type: 'belongs_to', key: 'parent_region' },
  };

  @field('region_name') regionName;

  @field('administrative_level') administrativeLevel;

  @field('parent_region') parentRegion;

  @field('location') location;

  @field('project') project;

  @field('path') path;

  // Add Frappe sync timestamp fields
  @date('creation') creation;

  @date('modified') modified;

  @date('created_at') createdAt;

  @date('updated_at') updatedAt;
}

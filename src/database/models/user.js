import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class User extends Model {
  static table = 'users';

  @field('username') username;

  @field('email') email;

  @field('full_name') fullName;

  // Add Frappe sync timestamp fields
  @date('creation') creation;

  @date('modified') modified;

  @date('created_at') createdAt;

  @date('updated_at') updatedAt;
}

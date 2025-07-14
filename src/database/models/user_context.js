import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class UserContext extends Model {
  static table = 'user_context';

  static associations = {
    users: { type: 'belongs_to', key: 'user_id' },
  };

  @field('user_id') userId;

  @field('context_data') contextData;

  // Add Frappe sync timestamp fields
  @date('creation') creation;

  @date('modified') modified;

  @date('created_at') createdAt;

  @date('updated_at') updatedAt;

  // Helper methods to parse JSON data
  getContextData() {
    try {
      return this.contextData ? JSON.parse(this.contextData) : {};
    } catch (error) {
      console.error('Error parsing context data:', error);
      return {};
    }
  }

  getAccessibleProjects() {
    try {
      const data = this.getContextData();
      return data.accessible_projects || [];
    } catch (error) {
      console.error('Error parsing accessible projects:', error);
      return [];
    }
  }

  getAccessibleRegions() {
    try {
      const data = this.getContextData();
      return data.accessible_regions || [];
    } catch (error) {
      console.error('Error parsing accessible regions:', error);
      return [];
    }
  }

  getAssignments() {
    try {
      const data = this.getContextData();
      return data.assignments || [];
    } catch (error) {
      console.error('Error parsing assignments:', error);
      return [];
    }
  }

  getPermissions() {
    try {
      const data = this.getContextData();
      return data.permissions || {};
    } catch (error) {
      console.error('Error parsing permissions:', error);
      return {};
    }
  }
}

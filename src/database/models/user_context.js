import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';

export default class UserContext extends Model {
  static table = 'user_context';
  static associations = {
    users: { type: 'belongs_to', key: 'user_id' },
  };

  @relation('users', 'user_id') user;
  @field('context_data') contextData;
  @field('accessible_projects') accessibleProjects;
  @field('accessible_regions') accessibleRegions;
  @field('assignments') assignments;
  @field('permissions') permissions;
  @date('last_updated') lastUpdated;
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
      return this.accessibleProjects ? JSON.parse(this.accessibleProjects) : [];
    } catch (error) {
      console.error('Error parsing accessible projects:', error);
      return [];
    }
  }

  getAccessibleRegions() {
    try {
      return this.accessibleRegions ? JSON.parse(this.accessibleRegions) : [];
    } catch (error) {
      console.error('Error parsing accessible regions:', error);
      return [];
    }
  }

  getAssignments() {
    try {
      return this.assignments ? JSON.parse(this.assignments) : [];
    } catch (error) {
      console.error('Error parsing assignments:', error);
      return [];
    }
  }

  getPermissions() {
    try {
      return this.permissions ? JSON.parse(this.permissions) : {};
    } catch (error) {
      console.error('Error parsing permissions:', error);
      return {};
    }
  }
}

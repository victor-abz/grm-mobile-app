import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class GrmProject extends Model {
  static table = 'grm_projects';

  @field('title') title;
  @field('project_code') projectCode;
  @field('description') description;
  @date('start_date') startDate;
  @date('end_date') endDate;
  @field('is_active') isActive;
  @field('logo') logo;
  @field('default_language') defaultLanguage;
  @field('auto_escalation_days') autoEscalationDays;
  @field('enable_citizen_feedback') enableCitizenFeedback;

  // Add Frappe sync timestamp fields
  @date('creation') creation;
  @date('modified') modified;

  @date('created_at') createdAt;
  @date('updated_at') updatedAt;
}

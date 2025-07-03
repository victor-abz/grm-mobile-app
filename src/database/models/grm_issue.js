import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class GrmIssue extends Model {
  static table = 'grm_issues';

  @field('tracking_code') trackingCode;
  @field('description') description;
  @field('issue_location') issueLocation;
  @field('citizen_type') citizenType;
  @field('citizen') citizen;
  @field('gender') gender;
  @field('contact_medium') contactMedium;
  @field('contact_info_type') contactInfoType;
  @field('contact_information') contactInformation;
  @field('resolution_days') resolutionDays;
  @date('resolution_date') resolutionDate;
  @field('resolution_accepted') resolutionAccepted;
  @field('rating') rating;
  @field('escalate_flag') escalateFlag;
  @field('confirmed') confirmed;

  // New action tracking fields
  @date('accepted_date') acceptedDate;
  @field('reject_reason') rejectReason;
  @date('rejected_date') rejectedDate;
  @field('escalation_reason') escalationReason;
  @field('resolution_text') resolutionText;
  @date('rated_date') ratedDate;
  @field('appeal_submitted') appealSubmitted;
  @date('appeal_date') appealDate;

  // CRITICAL: Add Frappe sync timestamp fields
  @date('creation') creation;
  @date('modified') modified;

  // Keep WatermelonDB timestamp fields
  @date('created_at') createdAt;
  @date('updated_at') updatedAt;

  // Lookup / foreign-key columns
  @field('project') project;
  @date('issue_date') issueDate;
  @date('intake_date') intakeDate;
  @field('category') category;
  @field('issue_type') issueType;
  @field('status') status;
  @field('citizen_age_group') citizenAgeGroup;
  @field('citizen_group_1') citizenGroup1;
  @field('citizen_group_2') citizenGroup2;
  @field('reporter') reporter;
  @field('assignee') assignee;
  @field('administrative_region') administrativeRegion;
  @field('amended_from') amendedFrom;
  @field('rejected_by') rejectedBy;
  @date('escalated_date') escalatedDate;
  @field('escalated_by') escalatedBy;
  @field('resolved_by') resolvedBy;
}

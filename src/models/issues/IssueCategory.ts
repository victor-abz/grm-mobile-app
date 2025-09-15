import { Model } from '@nozbe/watermelondb';
import { field, json, text } from "@nozbe/watermelondb/decorators";
import { TABLE_NAMES } from "../../migrations/tableName";
import { Base } from "../Base";


interface AssignedDepartment extends Base {
  administrative_level: string
}

interface AssignedEscalationDepartment extends Base {
  administrative_level: string
}

interface AssignedAppealDepartment extends Base {
  administrative_level: string
}

export interface IssueCategory extends Base {
  abbreviation: string,
  assigned_department: AssignedDepartment,
  assigned_appeal_department: AssignedAppealDepartment,
  assigned_escalation_department: AssignedEscalationDepartment,
  confidentiality_level: string,
  redirection_protocol: number,
  label: string,
  value: number
}

export class IssueCategoryLocalModel extends Model {
  static table =  TABLE_NAMES.issueCategory;

  // @ts-ignore
  @text('abbreviation') abbreviation;
  // @ts-ignore
  @json('assigned_department', json => json) assigned_department;
  // @ts-ignore
  @json('assigned_appeal_department', json => json) assigned_appeal_department;
  // @ts-ignore
  @json('assigned_escalation_department', json => json) assigned_escalation_department;
  // @ts-ignore
  @text('confidentiality_level') confidentiality_level;
  // @ts-ignore
  @text('created_date') created_date;
  // @ts-ignore
  @field('label') label;
  // @ts-ignore
  @text('name') name;
  // @ts-ignore
  @text('redirection_protocol') redirection_protocol;
  // @ts-ignore
  @text('value') value;
}

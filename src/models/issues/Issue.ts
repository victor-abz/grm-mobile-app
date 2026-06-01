import { Base } from "../Base";
import { Model } from "@nozbe/watermelondb";
import { json, text, field, date } from "@nozbe/watermelondb/decorators";
import { TABLE_NAMES } from "../../migrations/tableName";
import { IssueAttachment } from "./IssueAttachment";


export enum ContactMedium {
  CHANNEL_ALERT= 'channel-alert',
  FACILITATOR = 'facilitator',
  ANONYMOUS = 'anonymous'
}

export enum ContactMethod {
  EMAIL = 'email',
  PHONE_NUMBER = 'phone_number',
  WHATSAPP = 'whatsapp'
}

export interface CitizenGroup extends Base {
  type: string
}

export interface Citizen extends Base {
    age_group: Base,
    group: number,
    group_2: number,
    type: string,
}

export interface AdministrativeRegion extends Base {
  parent: Base;
  administrative_level: number
}

export interface Issue extends Base {
  administrative_region: Base;
  assignee: Base;
  escalate_flag: boolean;
  reject_flag: boolean;
  reject_reason?: string;
  rating?: number;
  escalation_reason?: string;
  research_result?: string;
  attachments: Array<IssueAttachment>,
  auto_increment_id: string,
  category: Base,
  citizen: Citizen,
  component: Base,
  confirmed: boolean,
  contact_medium: ContactMedium,
  contact_information: string;
  contact_method: ContactMethod;
  description: string;
  id: string;
  intake_date: string;
  issue_location_id: number;
  issue_sub_type: Base;
  issue_type: Base;
  internal_code: string;
  location_description: string;
  ongoing_issue: boolean;
  reporter: Base;
  resolution_date?: Date | null;
  title: string;
  tracking_code: string;
  sub_component: Base;
  status: Base;
}

export class IssueLocalModel extends Model {
  static table = TABLE_NAMES.issue;

  // @ts-ignore
  @json('administrative_region', (json) => json) administrative_region;
  // @ts-ignore
  @json('assignee', (json) => json) assignee;
  // @ts-ignore
  @json('attachments', (json) => json) attachments;
  // @ts-ignore
  @field('escalate_flag') escalate_flag;
  // @ts-ignore
  @field('reject_flag') reject_flag;
  // @ts-ignore
  @field('rating') rating;
  // @ts-ignore
  @text('escalation_reason') escalation_reason;
  // @ts-ignore
  @text('research_result') research_result;
  // @ts-ignore
  @text('auto_increment_id') auto_increment_id;
  // @ts-ignore
  @json('category', (json) => json) category;
  // @ts-ignore
  @json('citizen', (json) => json) citizen;
  // @ts-ignore
  @json('component', (json) => json) component;
  // @ts-ignore
  @field('confirmed') confirmed;
  // @ts-ignore
  @text('contact_medium') contact_medium;
  // @ts-ignore
  @text('reject_reason') reject_reason;
  // @ts-ignore
  @json('contact_information', (json) => json) contact_information;
  // @ts-ignore
  @text('contact_method') contact_method;
  // @ts-ignore
  @text('created_date') created_date;
  // @ts-ignore
  @text('updated_date') updated_date;
  // @ts-ignore
  @text('description') description;
  // @ts-ignore
  @text('intake_date') intake_date;
  // @ts-ignore
  @field('issue_location_id') issue_location_id;
  // @ts-ignore
  @json('issue_sub_type', (json) => json) issue_sub_type;
  // @ts-ignore
  @json('issue_type', (json) => json) issue_type;
  // @ts-ignore
  @text('internal_code') internal_code;
  // @ts-ignore
  @text('location_description') location_description;
  // @ts-ignore
  @text('name') name;
  // @ts-ignore
  @field('ongoing_issue') ongoing_issue;
  // @ts-ignore
  @json('reporter', (json) => json) reporter;
  // @ts-ignore
  @text('resolution_date') resolution_date;
  // @ts-ignore
  @text('title') title;
  // @ts-ignore
  @text('tracking_code') tracking_code;
  // @ts-ignore
  @json('sub_component', (json) => json) sub_component;
  // @ts-ignore
  @json('status', (json) => json) status;
}

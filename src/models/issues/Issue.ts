import { Base } from "../Base";
import { Model } from "@nozbe/watermelondb";
import { json, text, field } from "@nozbe/watermelondb/decorators";
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
    group: CitizenGroup,
    group_2: CitizenGroup,
    type: string,
}

export interface Issue extends Base {
  administrative_region: Base,
  assignee: Base,
  attachments: Array<IssueAttachment>,
  auto_increment_id: string,
  category: Base,
  citizen: Citizen,
  component: Base,
  confirmed: boolean,
  contact_medium: ContactMedium,
  contact_information: {
    type: ContactMethod,
    contact: string
  },
  contact_method: ContactMethod,
  description: string,
  id: string,
  intake_date: Date,
  issue_date?: Date | null,
  issue_location_id: number,
  issue_sub_type: Base,
  issue_type: Base,
  internal_code: string,
  location_description: string,
  ongoing_issue: boolean,
  reporter: Base,
  resolution_date?: Date | null,
  title: string,
  tracking_code: string,
  sub_component: Base,
  status: Base,
}

export class IssueLocalModel extends Model {
  static table = TABLE_NAMES.issue;

  // @ts-ignore
  @json('administrative_region') administrative_region;
  // @ts-ignore
  @json('assignee') assignee;
  // @ts-ignore
  @json('attachments') attachments;
  // @ts-ignore
  @text('auto_increment_id') auto_increment_id;
  // @ts-ignore
  @json('category') category;
  // @ts-ignore
  @json('citizen') citizen;
  // @ts-ignore
  @json('component') component;
  // @ts-ignore
  @field('confirmed') confirmed;
  // @ts-ignore
  @text('contact_medium') contact_medium;
  // @ts-ignore
  @json('contact_information') contact_information;
  // @ts-ignore
  @text('contact_method') contact_method;
  // @ts-ignore
  @text('created_date') created_date;
  // @ts-ignore
  @text('description') description;
  // @ts-ignore
  @text('intake_date') intake_date;
  // @ts-ignore
  @text('issue_date') issue_date;
  // @ts-ignore
  @field('issue_location_id') issue_location_id;
  // @ts-ignore
  @json('issue_sub_type') issue_sub_type;
  // @ts-ignore
  @json('issue_type') issue_type;
  // @ts-ignore
  @text('internal_code') internal_code;
  // @ts-ignore
  @text('location_description') location_description;
  // @ts-ignore
  @text('name') name;
  // @ts-ignore
  @field('ongoing_issue') ongoing_issue;
  // @ts-ignore
  @json('reporter') reporter;
  // @ts-ignore
  @text('resolution_date') resolution_date;
  // @ts-ignore
  @text('title') title;
    // @ts-ignore
  @text('tracking_code') tracking_code;
  // @ts-ignore
  @json('sub_component') sub_component;
  // @ts-ignore
  @json('status') status;
}

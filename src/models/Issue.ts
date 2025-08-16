import { Attachment } from "./Attachment";
import { Base } from "./Base";

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
  attachments: Array<Attachment>,
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
  issue_sub_type: string,
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

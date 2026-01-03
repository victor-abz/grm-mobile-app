import { Model } from '@nozbe/watermelondb';
import { field, text } from "@nozbe/watermelondb/decorators";
import { TABLE_NAMES } from "../../migrations/tableName";
import { Base } from "../Base";

export interface IssueAttachment extends Base {
  id: string;
  file_name: string;
  is_audio?: boolean;
  local_url: string;
  url?: string;
  parent_id: string,
}

export class IssueAttachmentLocalModel extends Model {
  static table =  TABLE_NAMES.issueAttachment;

  // @ts-ignore
  @text('created_date') created_date;
  // @ts-ignore
  @field('deleted_date') deleted_date;
  // @ts-ignore
  @text('local_url') local_url: string;
  // @ts-ignore
  @text('url') url: string;
  // @ts-ignore
  @field('is_audio') is_audio;
  // @ts-ignore
  @text('file_name') file_name;
  // @ts-ignore
  @field('sync_date') sync_date;
  // @ts-ignore
  @field('updated_date') updated_date;
  // @ts-ignore
  @field('parent_id') parent_id;

}

import { Model } from '@nozbe/watermelondb';
import { field, text } from "@nozbe/watermelondb/decorators";
import { TABLE_NAMES } from "../../migrations/tableName";
import { Base } from "../Base";

export interface IssueAttachment extends Base {
  id: string;
  file_name: string;
  is_audio: boolean;
  local_url: string;
  url?: string;
  parent_id: string,
}

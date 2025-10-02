import { Model } from '@nozbe/watermelondb';
import { field, text } from "@nozbe/watermelondb/decorators";
import { TABLE_NAMES } from "../../migrations/tableName";
import { Base } from "../Base";

export interface IssueAttachment extends Base {
  fileName: string;
  isAudio: boolean;
  localUrl: string;
  url?: string;
  parentId: string,
}

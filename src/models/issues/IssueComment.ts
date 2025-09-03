import { Base } from "../Base";
import { Attachment } from "../Attachment";
import { Model } from "@nozbe/watermelondb";
import { json, text, field } from "@nozbe/watermelondb/decorators";
import { TABLE_NAMES } from "../../migrations/tableName";


export interface IssueComment {
  id: string,
  comment: string,
  due_date?: Date | null,
  parent_id: string,
}

export class IssueCommentLocalModel extends Model {
  static table = TABLE_NAMES.issueComment;

  // @ts-ignore
  @text('comment') comment;
  // @ts-ignore
  @text('due_date') due_date;
  // @ts-ignore
  @text('parent_id') parent_id;
}

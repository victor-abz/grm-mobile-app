import { Model } from "@nozbe/watermelondb";
import { field, text } from "@nozbe/watermelondb/decorators";
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
  @text('comment_text') comment_text;
  // @ts-ignore
  @field('created_date') created_date;
  // @ts-ignore
  @field('deleted_date') deleted_date;
  // @ts-ignore
  @field('comment_due_date') comment_due_date;
  // @ts-ignore
  @field('sync_date') sync_date;
  // @ts-ignore
  @field('updated_date') updated_date;
  // @ts-ignore
  @field('parent_id') parent_id;
}
import { Model } from "@nozbe/watermelondb";
import { json, field, text } from "@nozbe/watermelondb/decorators";
import { TABLE_NAMES } from "../../migrations/tableName";

export interface CommentUser {
  id: string;
  name: string;
}

export interface IssueComment {
  id: string;
  comment: string;
  due_date?: string;
  parent_id: string;
  user: CommentUser;
  created_date: string;
  deleted_date?: string | null;
  updated_date?: string | null;
}

export class IssueCommentLocalModel extends Model {
  static table = TABLE_NAMES.issueComment;

  // @ts-ignore
  @text('comment') comment;
  // @ts-ignore
  @text('name') name;
  // @ts-ignore
  @json('user', (json) => json) user;
  // @ts-ignore
  @text('created_date') created_date;
  // @ts-ignore
  @text('deleted_date') deleted_date;
  // @ts-ignore
  @text('due_date') due_date;
  // @ts-ignore
  @text('sync_date') sync_date;
  // @ts-ignore
  @text('updated_date') updated_date;
  // @ts-ignore
  @field('parent_id') parent_id;
}
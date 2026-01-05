import { Model } from '@nozbe/watermelondb';
import { json, text } from '@nozbe/watermelondb/decorators';
import { TABLE_NAMES } from "../../migrations/tableName";
import { Base } from "../Base";

export interface IssueSubType extends Base {
  parent: Base
}

export class IssueSubTypeLocalModel extends Model {
  static table = TABLE_NAMES.issueSubType;

  // @ts-ignore
  @text('created_date') created_date;
  // @ts-ignore
  @text('updated_date') updated_date;
  // @ts-ignore
  @text('name') name;
  // @ts-ignore
  @json('parent', (json) => json) parent; // TODO: update relation to issue_type
}
  
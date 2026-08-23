import { Model } from '@nozbe/watermelondb';
import { json, text } from '@nozbe/watermelondb/decorators';
import { TABLE_NAMES } from "../../migrations/tableName";
import { Base } from "../Base";

export interface IssueSubComponent extends Base {
  description: string
  parent: Base
}

export class IssueSubComponentLocalModel extends Model {
  static table = TABLE_NAMES.issueSubComponent;

  // @ts-ignore
  @text('created_date') created_date;
  // @ts-ignore
  @text('updated_date') updated_date;
  // @ts-ignore
  @text('name') name;
  // @ts-ignore
  @text('description') description;
  // @ts-ignore
  @json('parent', (json) => json) parent;
}

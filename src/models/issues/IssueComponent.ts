import { Model } from '@nozbe/watermelondb';
import { text } from '@nozbe/watermelondb/decorators';
import { TABLE_NAMES } from "../../migrations/tableName";
import { Base } from "../Base";

export interface IssueComponent extends Base {
  description: string
}

export class IssueComponentLocalModel extends Model {
  static table = TABLE_NAMES.issueComponent;

  // @ts-ignore
  @text('created_date') created_date;
  // @ts-ignore
  @text('name') name;
  // @ts-ignore
  @text('description') description;

}

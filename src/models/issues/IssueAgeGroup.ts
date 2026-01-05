import { Model } from '@nozbe/watermelondb';
import { text } from '@nozbe/watermelondb/decorators';
import { TABLE_NAMES } from "../../migrations/tableName";
import { Base } from "../Base";

export interface IssueAgeGroup extends Base {}

export class IssueAgeGroupLocalModel extends Model {
  static table = TABLE_NAMES.issueAgeGroup;

  // @ts-ignore
  @text('name') name;
  // @ts-ignore
  @text('created_date') created_date;
  // @ts-ignore
  @text('updated_date') updated_date;
  // @ts-ignore
  @text('deleted_date') deleted_date;

}

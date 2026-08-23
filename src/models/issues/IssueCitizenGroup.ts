import { Model } from '@nozbe/watermelondb';
import { text } from '@nozbe/watermelondb/decorators';
import { TABLE_NAMES } from "../../migrations/tableName";
import { Base } from "../Base";

export interface IssueCitizenGroup extends Base {
  type: string,
}

export class IssueCitizenGroupLocalModel extends Model {
  static table = TABLE_NAMES.issueCitizenGroup;

  // @ts-ignore
  @text('name') name;
  // @ts-ignore
  @text('type') type;
  // @ts-ignore
  @text('created_date') created_date;
  // @ts-ignore
  @text('updated_date') updated_date;
  // @ts-ignore
  @text('deleted_date') deleted_date;

}

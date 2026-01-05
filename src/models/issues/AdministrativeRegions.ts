import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';
import { TABLE_NAMES } from "../../migrations/tableName";
import { Base } from "../Base";

export interface AdministrativeRegion extends Base {
  administrative_level: number;
  parent: number;
}

export class AdministrativeRegionLocalModel extends Model {
  static table = TABLE_NAMES.administrativeRegions;
  // @ts-ignore
  @text('created_date') created_date;
  // @ts-ignore
  @text('name') name;
  // @ts-ignore
  @field('administrative_level') administrative_level;
  // @ts-ignore
  @field('parent') parent;
}

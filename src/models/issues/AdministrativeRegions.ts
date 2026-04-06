import { Model } from '@nozbe/watermelondb';
import { text, field } from '@nozbe/watermelondb/decorators';
import { TABLE_NAMES } from "../../migrations/tableName";
import { Base } from "../Base";

export interface AdministrativeRegion extends Base {
  administrative_level: string;
  hierarchical_name: string;
}

export class AdministrativeRegionLocalModel extends Model {
  static table = TABLE_NAMES.administrativeRegions;
  // @ts-ignore
  @text('created_date') created_date;
  // @ts-ignore
  @text('name') name;
  // @ts-ignore
  @text('administrative_level') administrative_level;
  // @ts-ignore
  @text('hierarchical_name') hierarchical_name;
}

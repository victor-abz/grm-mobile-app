import { tableSchema, TableSchema } from "@nozbe/watermelondb";
import { TABLE_NAMES } from "../tableName";

export const administrativeRegionTableSchema: TableSchema = tableSchema({
  name:  TABLE_NAMES.administrativeRegions,
  columns: [
    { name: 'created_date', type: 'number' },
    { name: 'deleted_date', type: 'number', isOptional: true },
    { name: 'name', type: 'string' },
    { name: 'administrative_level', type: 'string' },
    { name: 'hierarchical_name', type: 'string'},
    { name: 'sync_date', type: 'number', isOptional: true },
    { name: 'updated_date', type: 'number' },
  ],
});

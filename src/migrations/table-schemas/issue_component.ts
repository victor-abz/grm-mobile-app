import { tableSchema, TableSchema } from "@nozbe/watermelondb";
import { TABLE_NAMES } from "../tableName";

export const issueComponentTableSchema: TableSchema = tableSchema({
  name:  TABLE_NAMES.issueComponent,
  columns: [
    { name: 'created_date', type: 'number' },
    { name: 'deleted_date', type: 'number', isOptional: true },
    { name: 'name', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'sync_date', type: 'number', isOptional: true },
    { name: 'updated_date', type: 'number' },
  ],
});

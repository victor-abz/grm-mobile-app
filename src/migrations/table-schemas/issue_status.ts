import { tableSchema, TableSchema } from "@nozbe/watermelondb";
import { TABLE_NAMES } from "../tableName";

export const issueStatusTableSchema: TableSchema = tableSchema({
      name:  TABLE_NAMES.issueStatus,
      columns: [
        { name: 'created_date', type: 'number' },
        { name: 'deleted_date', type: 'number', isOptional: true },
        { name: 'final_status', type: 'boolean' },
        { name: 'initial_status', type: 'boolean' },
        { name: 'name', type: 'string' },
        { name: 'open_status', type: 'boolean' },
        { name: 'rejected_status', type: 'boolean' },
        { name: 'sync_date', type: 'number', isOptional: true },
        { name: 'updated_date', type: 'number' },
      ],
});
    
// date column names should end with _at, relations should be named as field_id

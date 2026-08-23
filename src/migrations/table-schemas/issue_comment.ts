import { TableSchema, tableSchema } from "@nozbe/watermelondb";
import { TABLE_NAMES } from "../tableName";

export const issueCommentTableSchema: TableSchema = tableSchema({
  name:  TABLE_NAMES.issueComment,
  columns: [
    { name: 'comment', type: 'string' },
    { name: 'created_date', type: 'string' },
    { name: 'deleted_date', type: 'number', isOptional: true },
    { name: 'due_date', type: 'string' },
    { name: 'sync_date', type: 'number', isOptional: true },
    { name: 'updated_date', type: 'number' },
    { name: 'user', type: 'string' },
    { name: 'parent_id', type: 'string', isIndexed: true },
  ],
});

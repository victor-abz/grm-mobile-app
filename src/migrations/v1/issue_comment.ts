import { TableSchema, tableSchema } from "@nozbe/watermelondb";
import { TABLE_NAMES } from "../tableName";

export const issueCommentTableSchema: TableSchema = tableSchema({
  name:  TABLE_NAMES.issueComment,
  columns: [
    { name: 'comment_text', type: 'string' },
    { name: 'created_date', type: 'number' },
    { name: 'deleted_date', type: 'number', isOptional: true },
    { name: 'comment_due_date', type: 'number' },
    { name: 'sync_date', type: 'number', isOptional: true },
    { name: 'updated_date', type: 'number' },
    { name: 'parent_id', type: 'string', isIndexed: true },
  ],
});

import { tableSchema, TableSchema } from "@nozbe/watermelondb";
import { TABLE_NAMES } from "../tableName";

export const issueAttachmentTableSchema: TableSchema = tableSchema({
  name:  TABLE_NAMES.issueAttachment,
  columns: [
    { name: 'created_date', type: 'number' },
    { name: 'deleted_date', type: 'number', isOptional: true },
    { name: 'local_url', type: 'string' },
    { name: 'is_audio', type: 'boolean' },
    { name: 'file_name', type: 'string' },
    { name: 'sync_date', type: 'number', isOptional: true },
    { name: 'url', type: 'string' },
    { name: 'updated_date', type: 'number' },
    { name: 'parent_id', type: 'string', isIndexed: true },
  ],
});
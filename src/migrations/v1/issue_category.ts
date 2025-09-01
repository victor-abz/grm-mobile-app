import { tableSchema, TableSchema } from "@nozbe/watermelondb";
import { TABLE_NAMES } from "../tableName";

export const issueCategoryTableSchema: TableSchema = tableSchema({
  name:  TABLE_NAMES.issueCategory,
  columns: [
    { name: 'abbreviation', type: 'string' },
    { name: 'assigned_department', type: 'string' },
    { name: 'assigned_appeal_department', type: 'string' },
    { name: 'assigned_escalation_department', type: 'string' },
    { name: 'confidentiality_level', type: 'string' },
    { name: 'created_date', type: 'number' },
    { name: 'deleted_date', type: 'number', isOptional: true },
    { name: 'label', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'redirection_protocol', type: 'number' },
    { name: 'sync_date', type: 'number', isOptional: true },
    { name: 'value', type: 'string' },
    { name: 'updated_date', type: 'number' },
  ],
});

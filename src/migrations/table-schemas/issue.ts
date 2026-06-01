import { tableSchema, TableSchema } from '@nozbe/watermelondb';
import { TABLE_NAMES } from '../tableName';

export const issueTableSchema: TableSchema = tableSchema({
  name: TABLE_NAMES.issue,
  columns: [
    { name: 'administrative_region', type: 'string' },
    { name: 'assignee', type: 'string' },
    { name: 'category', type: 'string' },
    { name: 'citizen', type: 'string' },
    { name: 'contact_information', type: 'string', isOptional: true },
    { name: 'confirmed', type: 'boolean' }, // default false
    { name: 'contact_medium', type: 'string' },
    { name: 'contact_method', type: 'string', isOptional: true },
    { name: 'component', type: 'string' },
    { name: 'created_date', type: 'string' }, // DEFAULT CURRENT_TIMESTAMP
    { name: 'deleted_date', type: 'string', isOptional: true },
    { name: 'description', type: 'string' },
    { name: 'escalated_date', type: 'string', isOptional: true },
    { name: 'intake_date', type: 'string', isOptional: true, isIndexed: true }, // DEFAULT CURRENT_TIMESTAMP
    { name: 'issue_location', type: 'string' },
    { name: 'issue_type', type: 'string', isOptional: true },
    { name: 'issue_sub_type', type: 'string', isOptional: true },
    { name: 'location_description', type: 'string', isOptional: true },
    { name: 'ongoing_issue', type: 'boolean' }, // DEFAULT FALSE
    { name: 'reporter', type: 'string' },
    { name: 'resolution_date', type: 'number', isOptional: true }, // DEFAULT CURRENT_TIMESTAMP
    { name: 'status', type: 'string' },
    { name: 'sub_component', type: 'string', isOptional: true },
    { name: 'title', type: 'string' },
    { name: 'tracking_code', type: 'string' },
    { name: 'internal_code', type: 'string' },
    { name: 'sync_date', type: 'number', isOptional: true },
    { name: 'updated_date', type: 'string' },
    { name: 'escalate_flag', type: 'boolean' }, // DEFAULT FALSE
    { name: 'reject_flag', type: 'boolean' }, // DEFAULT FALSE
    { name: 'reject_reason', type: 'string', isOptional: true },
    { name: 'rating', type: 'number', isOptional: true },
    { name: 'escalation_reason', type: 'string', isOptional: true },
    { name: 'research_result', type: 'string', isOptional: true },
  ],
});

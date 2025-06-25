import { schemaMigrations, createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    // No migrations yet - this is for a fresh database
    // Future migrations will start from version 2
    // Migration to add user_context table
    {
      toVersion: 2,
      steps: [
        createTable({
          name: 'user_context',
          columns: [
            { name: 'user_id', type: 'string', isIndexed: true },
            { name: 'context_data', type: 'string' },
            { name: 'accessible_projects', type: 'string', isOptional: true },
            { name: 'accessible_regions', type: 'string', isOptional: true },
            { name: 'assignments', type: 'string', isOptional: true },
            { name: 'permissions', type: 'string', isOptional: true },
            { name: 'last_updated', type: 'number' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
    // Migration to add action tracking fields
    {
      toVersion: 3,
      steps: [
        addColumns({
          table: 'grm_issues',
          columns: [
            { name: 'accepted_date', type: 'number', isOptional: true },
            { name: 'reject_reason', type: 'string', isOptional: true },
            { name: 'rejected_date', type: 'number', isOptional: true },
            { name: 'rejected_by', type: 'string', isOptional: true, isIndexed: true },
            { name: 'escalated_date', type: 'number', isOptional: true },
            { name: 'escalated_by', type: 'string', isOptional: true, isIndexed: true },
            { name: 'escalation_reason', type: 'string', isOptional: true },
            { name: 'resolution_text', type: 'string', isOptional: true },
            { name: 'resolved_by', type: 'string', isOptional: true, isIndexed: true },
            { name: 'rated_date', type: 'number', isOptional: true },
            { name: 'appeal_submitted', type: 'boolean', isOptional: true },
            { name: 'appeal_date', type: 'number', isOptional: true },
          ],
        }),
        addColumns({
          table: 'grm_issue_logs',
          columns: [
            { name: 'action_taken', type: 'string', isOptional: true },
            { name: 'action_taken_date', type: 'number', isOptional: true },
            { name: 'action_taken_by', type: 'string', isOptional: true, isIndexed: true },
          ],
        }),
      ],
    },
    // Migration to add activity_type to comments
    {
      toVersion: 4,
      steps: [
        addColumns({
          table: 'grm_issue_comments',
          columns: [{ name: 'activity_type', type: 'string', isOptional: true }],
        }),
      ],
    },
  ],
});

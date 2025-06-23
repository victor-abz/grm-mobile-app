import { schemaMigrations, createTable } from '@nozbe/watermelondb/Schema/migrations';

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
  ],
});

import { schemaMigrations, addColumns } from '@nozbe/watermelondb/Schema/migrations'
import { TABLE_NAMES } from './tableName'

export default schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: TABLE_NAMES.issue,
          columns: [
            { name: 'issue_date', type: 'string', isOptional: true }
          ],
        }),
      ],
    },
  ],
});
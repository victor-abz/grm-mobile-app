import { schemaMigrations, addColumns, unsafeExecuteSql } from '@nozbe/watermelondb/Schema/migrations'
import { TABLE_NAMES } from './tableName';

export default schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: TABLE_NAMES.issue,
          columns: [{
            name: 'reject_reason',
            type: 'string',
            isOptional: true,
            isIndexed: false,
          }],
        }),
      ],
    },
  ],
});
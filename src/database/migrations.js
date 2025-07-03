import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    // No migrations - starting fresh with schema version 1
    // All tables and fields are included in the initial schema
    // Future migrations will start from version 2 when needed
  ],
});

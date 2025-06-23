import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import schema from './schema';
import { modelClasses } from './models';

// Create the SQLite adapter
const adapter = new SQLiteAdapter({
  schema,
  // Optional: Use experimental JSI for better performance
  jsi: true,
  // Optional: Enable migrations
  migrations: [],
  // Optional: Enable database debugging in development
  ...(__DEV__ && { dbName: 'GrmDatabase' }),
});

// Create the database instance
export const database = new Database({
  adapter,
  modelClasses,
  actionsEnabled: true, // Enable actions for better debugging
});

export default database;

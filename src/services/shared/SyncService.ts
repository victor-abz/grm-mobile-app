import { openDatabase, enablePromise } from 'react-native-sqlite-storage';

export const DB_VERSION = 1; //
const DB_NAME = "grm-db.db";
let dbInstance = null;

enablePromise(true);

export async function getDBConnection() {
  if (dbInstance) return dbInstance;

  dbInstance = await openDatabase({ name: DB_NAME, location: 'default' });
  return dbInstance;
}

export type Syncable = {
   sync(): Promise<void>;
   createTable(): Promise<void>
}

export class SyncService {
  constructor(
    private syncables: Syncable[] = []
  ) {}

  register(syncable: Syncable) {
    this.syncables.push(syncable);
  }

  async  initDB() {
    const db = await getDBConnection();

    // await db.executeSql(`DROP TABLE issue_statuses`);
    // await db.executeSql(`DROP TABLE meta`);

    // Check if schema version table exists
      await db.executeSql(`
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT
      )
    `);

    // Get current DB version
    const [results] = await db.executeSql(`SELECT value FROM meta WHERE key = 'db_version'`);
    console.log(results)
    const currentVersion = results?.rows?.length ? parseInt(results.rows.item(0).value, 10) : 0;

    if (currentVersion === 0) {
      // First run — create tables

      for (const syncable of this.syncables) {
        try {
          await syncable.createTable();
        } catch (err) {
          console.warn('[SyncService] Failed to sync a repository', err);
        }
      }


      // Save version
      await db.executeSql(`INSERT OR REPLACE INTO meta (key, value) VALUES ('db_version', ?)`, [
        DB_VERSION.toString(),
      ]);

    } else if (currentVersion < DB_VERSION) {
      // Migration path
      await this.runMigrations(db, currentVersion, DB_VERSION);

      await db.executeSql(`UPDATE meta SET value = ? WHERE key = 'db_version'`, [
        DB_VERSION.toString(),
      ]);
    }

    console.log("Finish migrations");

    return db;
  }

  removeAll() {
    this.syncables = [];
  }

  async runMigrations(db, fromVersion, toVersion) {
    console.log(`Migrating DB from v${fromVersion} to v${toVersion}`);

    // Example migration steps
    if (fromVersion < 2) {
      await db.executeSql(`ALTER TABLE users ADD COLUMN phone TEXT`);
    }

    // Add more migrations here for future versions
  }

  async syncAll(): Promise<void> {
    for (const syncable of this.syncables) {
      try {
        await syncable.sync();
      } catch (err) {
        console.warn('[SyncService] Failed to sync a repository', err);
      }
    }
  }
}

export const syncServiceInstance = new SyncService();

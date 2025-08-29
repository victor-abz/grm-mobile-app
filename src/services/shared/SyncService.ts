import { enablePromise } from 'react-native-sqlite-storage';
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
import { Database } from "@nozbe/watermelondb";
import schema from "../../migrations/schemas";
import migrations from "../../migrations/migrations";
import { synchronize } from "@nozbe/watermelondb/sync";
import { IssueStatusLocalModel } from "../../models/issues/IssueStatus";
import { IssueLocalModel } from "../../models/issues/Issue";

const DB_NAME = "grm-db";

enablePromise(true);

export type Syncable = {
  pullChanges({ tableName, lastPulledAt }): Promise<{
    changes: { [tableName]: { deleted: any[]; created: any[]; updated: any[] } };
    timestamp: number
  }>;
  pushChanges({ changes, lastPulledAt }): Promise<void>;
  tableName: string
}

export class SyncService {
  database: Database | null = null; // 💡 Store the database instance here

  constructor(
    private syncables: Syncable[] = []
  ) { }

  register(syncable: Syncable) {
    this.syncables.push(syncable);
  }

  async initDB() {
    console.log('INIT DB')
    const adapter = new SQLiteAdapter({
      schema,
      migrations,
      dbName: DB_NAME,
      jsi: true,
      onSetUpError: error => {
        // Database failed to load -- offer the user to reload the app or log out
      }
    });
    this.database = new Database({
      adapter,
      modelClasses: [
        IssueStatusLocalModel,
        IssueLocalModel,
      ],
    });

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
    if (!this.database) {
      throw new Error("Database not initialized. Call initDB() first.");
    }

    return await synchronize({
      database: this.database,
      pullChanges: async ({ lastPulledAt }) => {
        console.log(`🍉 Pulling with lastPulledAt = ${lastPulledAt}`);
        const changes = {};
        const timestamp = Date.now();
        for (const syncable of this.syncables) {
          changes[syncable.tableName] = await syncable.pullChanges({ tableName: syncable.tableName, lastPulledAt });
        }
        console.log(`🍉 Changes pulled successfully. Timestamp: ${timestamp}`);

        return { changes, timestamp };
      },
      pushChanges: async ({ changes, lastPulledAt }) => {
        console.log(`🍉 Pushing with lastPulledAt = ${lastPulledAt}`);
        for (const syncable of this.syncables) {
          await syncable.pushChanges({ changes, lastPulledAt });
        }
        console.log(`🍉 Changes pushed successfully.`);
      },
      sendCreatedAsUpdated: true,
    });
  }

}

export const syncServiceInstance = new SyncService();

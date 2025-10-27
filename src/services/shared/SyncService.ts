import { enablePromise } from 'react-native-sqlite-storage';
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
import { Database } from "@nozbe/watermelondb";
import schema from "../../migrations/appSchema";
import migrations from "../../migrations/migrations";
import { synchronize } from "@nozbe/watermelondb/sync";
import { IssueStatusLocalModel } from "../../models/issues/IssueStatus";
import { IssueLocalModel } from "../../models/issues/Issue";
import { IssueTypeLocalModel } from "../../models/issues/IssueType";
import { IssueCategoryLocalModel } from "../../models/issues/IssueCategory";
import { IssueCommentLocalModel } from "../../models/issues/IssueComment";
import { IssueAttachmentLocalModel } from "../../models/issues/IssueAttachment";

const DB_NAME = "grm-db";

enablePromise(true);

export type Syncable = {
   pullChanges({ tableName, lastPulledAt }): Promise<{
    changes: { tableName: { deleted: any[]; created: any[]; updated: any[] } };
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
    const adapter = new SQLiteAdapter({
      schema,
      migrations,
      dbName: DB_NAME,
      onSetUpError: error => {
        // Database failed to load -- offer the user to reload the app or log out
        console.log("Watermelon Adapter set up Failed", error);
      }
    });

    this.database = new Database({
      adapter,
      modelClasses: [
        IssueStatusLocalModel,
        IssueLocalModel,
        IssueTypeLocalModel,
        IssueCategoryLocalModel,
        IssueCommentLocalModel,
        IssueAttachmentLocalModel,
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
    console.log("SYNCING ALL");
    
    if (!this.database) {
      throw new Error("Database not initialized. Call initDB() first.");
    }


    return await synchronize({
      database: this.database,
        pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
          console.log(`🍉 Pulling with lastPulledAt = ${lastPulledAt}`);
          let changes = {};          
          const timestamp = Date.now();
          for (const syncable of this.syncables) {
            const syncableChanges = await syncable.pullChanges({ tableName: syncable.tableName, lastPulledAt });            
            
            // Create unique issue list from remote lists
            if (changes && changes.issue) {
              const createdUniqueArray = Array.from(
                new Map(
                  [...changes.issue.created, ...syncableChanges.changes.issue.created]
                    .map((item) => [item.id, item])
                ).values()
              );
              const updatedUniqueArray = Array.from(
                new Map(
                  [...changes.issue.updated, ...syncableChanges.changes.issue.updated]
                    .map((item) => [item.id, item])
                  ).values()
              );
              const deletedUniqueArray = Array.from(
                new Map(
                  [...changes.issue.deleted, ...syncableChanges.changes.issue.deleted]
                    .map((item) => [item.id, item])
                  ).values()
              );
              
              changes = { ...changes, issue: { created: createdUniqueArray, updated: updatedUniqueArray, deleted: deletedUniqueArray } }
              
            } else {
              changes = { ...syncableChanges.changes, ...changes }
            }
            
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

        }
      });
    }

}

export const syncServiceInstance = new SyncService();

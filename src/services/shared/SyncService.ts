import { enablePromise } from 'react-native-sqlite-storage';
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
import { Database } from "@nozbe/watermelondb";
import schema from "../../migrations/appSchema";
import migrations from "../../migrations/migrations";
import { synchronize } from "@nozbe/watermelondb/sync";
import { IssueStatusLocalModel } from "../../models/issues/IssueStatus";
import { IssueLocalModel } from "../../models/issues/Issue";
import { IssueTypeLocalModel } from "../../models/issues/IssueType";
import { IssueSubTypeLocalModel } from '../../models/issues/IssueSubType';
import { IssueCategoryLocalModel } from "../../models/issues/IssueCategory";
import { IssueComponentLocalModel } from '../../models/issues/IssueComponent';
import { IssueAgeGroupLocalModel } from '../../models/issues/IssueAgeGroup';
import { IssueSubComponentLocalModel } from '../../models/issues/IssueSubComponent';
import { AdministrativeRegionLocalModel } from '../../models/issues/AdministrativeRegions';
import { IssueCommentLocalModel } from "../../models/issues/IssueComment";
import { IssueAttachmentLocalModel } from "../../models/issues/IssueAttachment";
import { IssueCitizenGroupLocalModel } from '../../models/issues/IssueCitizenGroup';


const DB_NAME = "grm-db";

enablePromise(true);

export type Syncable = {
   pullChanges({ tableName, lastPulledAt }): Promise<{
    changes: { tableName: { deleted: any[]; created: any[]; updated: any[] } };
    timestamp: number
  }>;
   pushChanges({ changes, lastPulledAt }): Promise<void>;
  tableName: string,
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
        AdministrativeRegionLocalModel,
        IssueStatusLocalModel,
        IssueLocalModel,
        IssueTypeLocalModel,
        IssueSubTypeLocalModel,
        IssueCategoryLocalModel,
        IssueComponentLocalModel,
        IssueAgeGroupLocalModel,
        IssueSubComponentLocalModel,
        IssueCommentLocalModel,
        IssueAttachmentLocalModel,
        IssueCitizenGroupLocalModel
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
    console.log('SYNCING ALL');
    if (!this.database) {
      throw new Error('Database not initialized. Call initDB() first.');
    }

    try {
      await synchronize({
        database: this.database,
        pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
          // console.log(`🍉 Pulling with lastPulledAt = ${lastPulledAt}`);
          let changes = {};
          console.log('From DB LAST PULLED:', new Date(lastPulledAt).toISOString());

          const timestamp = Date.now();
          for (const syncable of this.syncables) {
            const syncableChanges = await syncable.pullChanges({
              tableName: syncable.tableName,
              lastPulledAt,
            });

            // Create unique issue list from remote lists
            if (
              changes &&
              changes.issue &&
              syncableChanges.changes &&
              syncableChanges.changes.issue
            ) {
              const createdUniqueArray = Array.from(
                new Map(
                  [
                    ...(changes.issue.created || []),
                    ...(syncableChanges.changes.issue.created || []),
                  ].map((item) => [item.id, item])
                ).values()
              );
              const updatedUniqueArray = Array.from(
                new Map(
                  [
                    ...(changes.issue.updated || []),
                    ...(syncableChanges.changes.issue.updated || []),
                  ].map((item) => [item.id, item])
                ).values()
              );
              
              const deletedUniqueArray = [
                ...(changes.issue.deleted || []),
                ...(syncableChanges.changes.issue.deleted || []),
              ];

              changes = {
                ...changes,
                issue: {
                  created: createdUniqueArray,
                  updated: updatedUniqueArray,
                  deleted: deletedUniqueArray,
                },
              };
            } else {
              changes = { ...syncableChanges.changes, ...changes };
            }
            
          }
          console.log(`🍉 Changes pulled successfully. Timestamp: ${timestamp}`);
          
          const hasData = Object.values(changes ?? {}).some((table) =>
            Object.values(table ?? {}).some(
              (arr: unknown) => Array.isArray(arr) && (arr as unknown[]).length > 0
            )
          );
          
          // Keep using old timestamp.
          // if (!hasData) return { changes, timestamp: lastPulledAt };
          if (!hasData) return;

          // Otherwise, set a new one.
          console.log(new Date(timestamp).toISOString());

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
    } catch (error) {
      console.log('Sync All error: ', error);
    }

  }

}

export const syncServiceInstance = new SyncService();

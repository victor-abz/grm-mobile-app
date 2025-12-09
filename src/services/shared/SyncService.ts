import { enablePromise } from 'react-native-sqlite-storage';
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
import { Database, DirtyRaw, Model } from "@nozbe/watermelondb";
import schema from "../../migrations/appSchema";
import migrations from "../../migrations/migrations";
import { SyncDatabaseChangeSet, synchronize } from "@nozbe/watermelondb/sync";
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
import type { CreatedResponseWithBackendId, WatermelonId } from './BaseService';
import { TABLE_NAMES } from '../../migrations/tableName';

const DB_NAME = "grm-db";

enablePromise(true);

export type Syncable = {
  replaceParentIds?(idsToReplace: [CreatedResponseWithBackendId, WatermelonId][]): Promise<Model[]>;
  pullChanges({
    tableName,
    lastPulledAt,
    parentIds: [],
  }: {
    tableName: string;
    lastPulledAt: any;
    parentIds?: { created: DirtyRaw[]; updated: DirtyRaw[]; deleted: string[] };
  }): Promise<{
    changes: {
      issue: { tableName: { deleted: any[]; created: any[]; updated: any[] } };
      tableName: { deleted: any[]; created: any[]; updated: any[] };
    };
    timestamp: number;
    createdRecordsPostPushedWithNewBackendIDs: [CreatedResponseWithBackendId, WatermelonId][]; // push primero, espera y viene en el pull
  }>;
  pushChanges({ changes, lastPulledAt }): Promise<void>;
  tableName: string;
};

export class SyncService {
  database: Database | null = null; // 💡 Store the database instance here
  createdRecordsPostPushedWithNewBackendIDsPerTable: {
    [key: string]: [CreatedResponseWithBackendId, WatermelonId][];
  } = {};

  
  private changesToPush: any;
  private markedTimestamp: number;
  private parentChanges: SyncDatabaseChangeSet = null;

  constructor(
    private syncables: Syncable[] = [],
    private childSyncables: Syncable[] = []
  ) {}

  register(syncable: Syncable) {
    this.syncables.push(syncable);
  }

  registerChildSyncables(syncable: Syncable) {
    this.childSyncables.push(syncable);
  }

  async initDB() {
    const adapter = new SQLiteAdapter({
      schema,
      migrations,
      dbName: DB_NAME,
      onSetUpError: (error) => {
        // Database failed to load -- offer the user to reload the app or log out
        console.log('Watermelon Adapter set up Failed', error);
      },
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
        IssueCitizenGroupLocalModel,
      ],
    });
  }

  removeAll() {
    this.syncables = [];
    this.childSyncables = [];
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
          this.parentChanges = {};

          console.log('From DB LAST PULLED:', new Date(lastPulledAt).toISOString());

          const timestamp = Date.now();

          this.markedTimestamp = timestamp;

          for (const syncable of this.syncables) {
            const syncableChanges = await syncable.pullChanges({
              tableName: syncable.tableName,
              lastPulledAt,
            });
            // Keep temporarily replaced records with new backend ID
            // TODO: handle assignee - reporter
            this.createdRecordsPostPushedWithNewBackendIDsPerTable = {
              ...this.createdRecordsPostPushedWithNewBackendIDsPerTable,
              [syncable.tableName]: syncableChanges.createdRecordsPostPushedWithNewBackendIDs,
            };

            // Create unique issue list from remote lists
            if (
              this.parentChanges &&
              this.parentChanges.issue &&
              syncableChanges.changes &&
              syncableChanges.changes.issue
            ) {
              const createdUniqueArray = Array.from(
                new Map(
                  [
                    ...(this.parentChanges.issue.created || []),
                    ...(syncableChanges.changes.issue.created || []),
                  ].map((item) => [item.id, item])
                ).values()
              );

              const updatedUniqueArray = Array.from(
                new Map(
                  [
                    ...(this.parentChanges.issue.updated || []),
                    ...(syncableChanges.changes.issue.updated || []),
                  ].map((item) => [item.id, item])
                ).values()
              );

              const deletedUniqueArray = [
                ...(this.parentChanges.issue.deleted || []),
                ...(syncableChanges.changes.issue.deleted || []),
              ];

              this.parentChanges = {
                ...this.parentChanges,
                issue: {
                  created: createdUniqueArray,
                  updated: updatedUniqueArray,
                  deleted: deletedUniqueArray,
                },
              };
            } else {
              this.parentChanges = { ...syncableChanges.changes, ...this.parentChanges };
            }
          }

              changes = { ...syncableChanges.changes, ...changes };
            }
            
          }

          console.log(`🍉 Changes pulled successfully. Timestamp: ${timestamp}`);

          const hasData = Object.values(this.parentChanges ?? {}).some((table) =>
            Object.values(table ?? {}).some(
              (arr: unknown) => Array.isArray(arr) && (arr as unknown[]).length > 0
            )
          );

          // if (!hasData) return { changes, timestamp: lastPulledAt };
          if (!hasData) {
            this.parentChanges = null;
            return;
          }

          // Otherwise, set a new one.
          console.log(new Date(timestamp).toISOString());

          return { changes: this.parentChanges, timestamp };
        },

        pushChanges: async ({ changes, lastPulledAt }) => {
          console.log('Pushing CHANGES: ', JSON.stringify(changes, null, 2));
          console.log(`🍉 Pushing with lastPulledAt = ${lastPulledAt}`);

          this.changesToPush = changes;

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

function getParentTableName(childTableName: string): string {
  switch (childTableName) {
    case TABLE_NAMES.issueAttachment: 
      return TABLE_NAMES.issue
    case TABLE_NAMES.issueComment:
      return TABLE_NAMES.issue
  }
}
import { Model } from "@nozbe/watermelondb";
import { SyncDatabaseChangeSet, synchronize } from "@nozbe/watermelondb/sync";
import type { CreatedResponseWithBackendId, WatermelonId } from './BaseService';
import { TABLE_NAMES } from '../../migrations/tableName';
import { fetchIssueList } from '../issues/IssueService';
import { Syncable } from './types';
import { databaseServiceInstance } from "../../utils/storageManager";

export class SyncService {
  createdRecordsPostPushedWithNewBackendIDsPerTable: {
    [key: string]: [CreatedResponseWithBackendId, WatermelonId][];
  } = {};
  firstSync = false
  isSyncFinished = true

  private pushedParentChanges: any;
  private markedTimestamp: number;
  private pulledParentsChanges: SyncDatabaseChangeSet = null;

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

  removeAll() {
    this.syncables = [];
    this.childSyncables = [];
  }

  async syncAll(): Promise<void> {
    console.log('SYNCING ALL');
    if (!databaseServiceInstance.database) {
      throw new Error('Database not initialized. Call initDB() first.');
    }

    if (!this.isSyncFinished) {
      throw new Error('Sync in progress.');
    }

    this.isSyncFinished = false;

    try {
      await synchronize({
        database: databaseServiceInstance.database,
        pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
          this.pulledParentsChanges = {};

          if (!lastPulledAt) {
            this.firstSync = true;
          }

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
              this.pulledParentsChanges &&
              this.pulledParentsChanges.issue &&
              syncableChanges.changes &&
              syncableChanges.changes.issue
            ) {
              const createdUniqueArray = Array.from(
                new Map(
                  [
                    ...(this.pulledParentsChanges.issue.created || []),
                    ...(syncableChanges.changes.issue.created || []),
                  ].map((item) => [item.id, item])
                ).values()
              );

              const updatedUniqueArray = Array.from(
                new Map(
                  [
                    ...(this.pulledParentsChanges.issue.updated || []),
                    ...(syncableChanges.changes.issue.updated || []),
                  ].map((item) => [item.id, item])
                ).values()
              );

              const deletedUniqueArray = [
                ...(this.pulledParentsChanges.issue.deleted || []),
                ...(syncableChanges.changes.issue.deleted || []),
              ];

              this.pulledParentsChanges = {
                ...this.pulledParentsChanges,
                issue: {
                  created: createdUniqueArray,
                  updated: updatedUniqueArray,
                  deleted: deletedUniqueArray,
                },
              };
            } else {
              this.pulledParentsChanges = {
                ...syncableChanges.changes,
                ...this.pulledParentsChanges,
              };
            }
          }

          console.log(`🍉 Changes pulled successfully. Timestamp: ${timestamp}`);

          const hasData = Object.values(this.pulledParentsChanges ?? {}).some((table) =>
            Object.values(table ?? {}).some(
              (arr: unknown) => Array.isArray(arr) && (arr as unknown[]).length > 0
            )
          );

          // if (!hasData) return { changes, timestamp: lastPulledAt };
          if (!hasData) {
            this.pulledParentsChanges = null;
            return;
          }

          // Otherwise, set a new one.
          console.log(new Date(timestamp).toISOString());

          return { changes: this.pulledParentsChanges, timestamp };
        },

        pushChanges: async ({ changes, lastPulledAt }) => {
          console.log('Pushing CHANGES: ', JSON.stringify(changes, null, 2));
          console.log(`🍉 Pushing with lastPulledAt = ${lastPulledAt}`);

          this.pushedParentChanges = changes;

          for (const syncable of this.syncables) {
            await syncable.pushChanges({ changes, lastPulledAt });
          }

          console.log(`🍉 Changes pushed successfully.`);
        },
        sendCreatedAsUpdated: true,
      });
    } catch (error) {
      this.isSyncFinished = true;
      console.log('Sync All error: ', error);
    }

    // Update locally and manually push changes of child syncables with their BE generated parent_ids and mark them as synced
    try {
      if (this.pushedParentChanges) {
        for (const syncable of this.childSyncables) {
          const parentTableName = getParentTableName(syncable.tableName);

          const replacedItems: Model[] = await syncable.replaceParentIds(
            this.createdRecordsPostPushedWithNewBackendIDsPerTable[parentTableName],
            'synced'
          );

          console.log('replaced items', replacedItems);

          // Ensure we have a place for this table's changes
          const tableChanges = this.pushedParentChanges?.[syncable.tableName] ?? {
            created: [],
            updated: [],
            deleted: [],
          };

          console.log('table changes', tableChanges);

          const updateParentIdFor = (arr: any[] = []) =>
            arr.map((record: any) => {
              const match = replacedItems.find((r: any) => {
                const rid = typeof r.id === 'string' ? r.id : r._raw?.id;
                return rid === record.id;
              });

              if (!match) return record;

              // Try to obtain the new parent id from the Model's raw or properties
              const newParentId =
                match._raw?.parent_id ??
                match._raw?.parentId ??
                (match as any).parent_id ??
                (match as any).parentId;

              if (newParentId == null) return record;

              return { ...record, parent_id: newParentId };
            });

          this.pushedParentChanges[syncable.tableName] = {
            ...tableChanges,
            created: updateParentIdFor(tableChanges.created),
            updated: updateParentIdFor(tableChanges.updated),
          };

          console.log(this.pushedParentChanges);

          // update this.changesToPush with the upper replaceParentIds executed()
          await syncable.pushChanges({
            changes: this.pushedParentChanges,
            lastPulledAt: this.markedTimestamp,
          });

          this.pushedParentChanges = null;
        }
      }
    } catch (error) {
      this.isSyncFinished = true;
      console.error('Error pushing updated sub items with parent ids', error);
    }

    // [x] Synchronize sub items with newly created parent ids from backend
    // [x] handle replace ids for new ones - Object.keys(this.createdRecordsPostPushedWithNewBackendIDsPerTable).length > 0
    // [x] create local url by downloading the remote url or ask backend to create local url
    // [x] handle when no parent changes, first sync for example.
    // Partially done, perhaps if just an attachment changes.
    // Suggest updating issue updated_at at backend when new attachments/comments are modified
    // [x] also delete file when sync replaces the old one
    // [x] fix converted string attachment url
    // [x] (the other devices receive the attachments)
    // [x] creator device sends attachment, download the BE path.

    // the creator device has an empty attachment if:
    // [ ] Creates_offline-reconnect-push-disconnect[here], but the other devices work
    // [ ] Connect inside local list - (test network monitor sync all)
    // [ ] check interrupting queue of sub items
    // [ ] Local getAll pagination
    // [ ] Reporter/assignee attachments behaviour
    // [x] recover internet inside issues list - check attachments
    
    // [ ] Implement delete attachment
    // [ ] Implement audio play migration to new versions.

    // [x] create offline, connect push everything, disconnect, check files

    // [x](possible solution -> move cache file url to universal files DB path on pull // (check new login on other devices, avoid downloading all of the files)
    // (possible solution2 -> keep record of cache files mapped with their new parent issue ids until you enter the issue detail and create the file )

    // [x] create more than one issue offline - sync - check attachments.

    if (this.pulledParentsChanges || this.firstSync) {
      try {
        await synchronize({
          database: databaseServiceInstance.database,
          pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
            let changes = {};
            console.log('SUB-ITEMS - From DB LAST PULLED:', new Date(lastPulledAt).toISOString());
            for (const syncable of this.childSyncables) {
              let allParents: {
                created: any[];
                updated: any[];
                deleted: string[];
              };
              if (this.firstSync) {
                const _allParents = await getAllParents(syncable.tableName);
                allParents = { created: [], updated: _allParents, deleted: [] };
              }
              const syncableChanges = await syncable.pullChanges({
                tableName: syncable.tableName,
                lastPulledAt,
                parentChanges:
                  allParents ?? this.pulledParentsChanges[getParentTableName(syncable.tableName)],
              });
              changes = { ...syncableChanges.changes, ...changes };
              // Empty old IDs array at 'tableName' key
              this.createdRecordsPostPushedWithNewBackendIDsPerTable[syncable.tableName] = [];
            }
            // Reset parent changes
            this.pulledParentsChanges = null;
            const hasData = Object.values(changes ?? {}).some((table) =>
              Object.values(table ?? {}).some(
                (arr: unknown) => Array.isArray(arr) && (arr as unknown[]).length > 0
              )
            );
            console.log('Have sub items data? ', hasData);
            console.log('markedTimes ', this.markedTimestamp);
            // Keep using old timestamp.
            // if (!hasData) return { changes, timestamp: lastPulledAt };
            if (!hasData) return;
            // Otherwise, set a new one.
            console.log(new Date(this.markedTimestamp).toISOString());
            return { changes, timestamp: this.markedTimestamp };
          },

          // To be used for delete attachments, for example
          pushChanges: async ({ changes, lastPulledAt }) => {
            console.log('Pushing Child Syncables: ', JSON.stringify(changes, null, 2));
            console.log(`🍉 Pushing with lastPulledAt = ${lastPulledAt}`);

            for (const syncable of this.childSyncables) {
              await syncable.pushChanges({ changes, lastPulledAt });
            }

            console.log(`🍉 Changes pushed successfully.`);
          },
          sendCreatedAsUpdated: true,
        });
      } catch (error) {
        this.isSyncFinished = true;
        console.log('Sync All error 2 : ', error);
      }

      // if error on first sync - handle
      this.isSyncFinished = true;
      this.firstSync = false;
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

async function getAllParents(childTableName: string): Promise<any[]> {
  switch (childTableName) {
    case TABLE_NAMES.issueAttachment:
      return await fetchIssueList('reporter');
    case TABLE_NAMES.issueComment:
      return await fetchIssueList('reporter');
  }
}


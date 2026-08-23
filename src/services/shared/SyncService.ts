import { Model } from '@nozbe/watermelondb';
import { SyncDatabaseChangeSet, synchronize } from '@nozbe/watermelondb/sync';
import type { CreatedResponseWithBackendId, WatermelonId } from './BaseService';
import { watermelonController } from './BaseService';
import { TABLE_NAMES } from '../../migrations/tableName';
import { fetchIssueList } from '../issues/IssueService';
import { Syncable } from './types';
import { databaseServiceInstance } from '../../utils/storageManager';
import { removeDuplicates } from '../../utils/utils';
import { Issue } from '../../models/issues/Issue';

export class SyncService {
  createdRecordsPostPushedWithNewBackendIDsPerTable: {
    [key: string]: [CreatedResponseWithBackendId, WatermelonId][];
  } = {};
  firstSync = false;
  isSyncFinished = true;

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
      return;
    }

    if (watermelonController.isManuallyUpdating) {
      return;
    }

    this.isSyncFinished = false;

    // Synchronize Parent Elements
    try {
      await synchronize({
        database: databaseServiceInstance.database,
        pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
          this.pulledParentsChanges = {};

          if (!lastPulledAt) {
            this.firstSync = true;
          }

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

          const hasData = Object.values(this.pulledParentsChanges ?? {}).some((table) =>
            Object.values(table ?? {}).some(
              (arr: unknown) => Array.isArray(arr) && (arr as unknown[]).length > 0
            )
          );
          if (!hasData) {
            this.pulledParentsChanges = null;
            return Promise.reject(
              'No parent elements at changes object available or network error'
            );
          }
          console.log(`🍉 Changes pulled successfully. Timestamp: ${timestamp}`);
          return { changes: this.pulledParentsChanges, timestamp };
        },

        pushChanges: async ({ changes, lastPulledAt }) => {
          // console.log('Pushing CHANGES: ', JSON.stringify(changes, null, 2));
          console.log(`🍉 Pushing with lastPulledAt = ${lastPulledAt}`);

          this.pushedParentChanges = changes;

          for (const syncable of this.syncables) {
            await syncable.pushChanges({ changes, lastPulledAt });
          }

          // Check if child items with real parent ids exists to
          // create them too (adding comments to an old existing issue for example)
          let _childChanges: {
            [key: string]: { created: any[]; updated: any[]; deleted: any[] };
          } = {};
          for (const syncable of this.childSyncables) {
            let childChanges = {};

            const createdChildChanges = changes[syncable.tableName].created.map((i) =>
              !!i.parent_id ? { ...i, parent_id: String(i.parent_id) } : null
            );

            const updatedChildChanges = changes[syncable.tableName].updated.map((i) =>
              !!i.parent_id ? { ...i, parent_id: String(i.parent_id) } : null
            );

            const deletedChildChanges = changes[syncable.tableName].deleted;

            _childChanges[syncable.tableName] = {
              created: createdChildChanges,
              updated: updatedChildChanges,
              deleted: deletedChildChanges,
            };

            if (
              createdChildChanges.length > 0 ||
              updatedChildChanges.length > 0 ||
              deletedChildChanges.length > 0
            ) {
              await syncable.pushChanges({ changes: _childChanges, lastPulledAt });
            }
          }

          console.log(`🍉 Changes pushed successfully.`);
        },
        sendCreatedAsUpdated: true,
      });
    } catch (error) {
      this.isSyncFinished = true;
      console.log('SyncAll() error: ', error);
    }

    // Update Everything locally. Also, manually push old child items with new parent ids
    // using child syncables with their BE generated parent_ids and mark them as synced locally
    try {
      if (this.pushedParentChanges) {
        for (const syncable of this.childSyncables) {
          const parentTableName = getParentTableName(syncable.tableName);

          // Prepare database items with parent ids generated from backend.
          const replacedItems: Model[] = await syncable.replaceParentIds(
            this.createdRecordsPostPushedWithNewBackendIDsPerTable[parentTableName],
            'synced'
          );

          // Ensure we have a place for this table's changes
          const tableChanges = this.pushedParentChanges?.[syncable.tableName] ?? {
            created: [],
            updated: [],
            deleted: [],
          };

          // console.log('table changes', tableChanges);

          // Declaration of function to add the replaced items to the Table changes object
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

          // console.log(this.pushedParentChanges);

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

    // If New Pulled Parent Changes Available - Synchronize the rest of the children properties -
    if (this.pulledParentsChanges || this.firstSync) {
      try {
        await synchronize({
          database: databaseServiceInstance.database,
          pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
            let changes = {};
            console.log('🍉 Pull child elements intent...');

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
              // Pull Child Changes

              const syncableChanges = await syncable.pullChanges({
                tableName: syncable.tableName,
                lastPulledAt: this.firstSync ? null : lastPulledAt,
                forceFetchAllPages: true,
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
            // Keep using old timestamp.
            if (!hasData)
              return Promise.reject(
                'No children elements at changes object available or network error'
              );
            // Otherwise, set a new one.
            return { changes, timestamp: this.markedTimestamp };
          },

          // To be used with delete attachments, for example
          pushChanges: async ({ changes, lastPulledAt }) => {
            // console.log('Pushing Child Syncables: ', JSON.stringify(changes, null, 2));
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
        console.log('SyncAll() child elements error: ', error);
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
      return TABLE_NAMES.issue;
    case TABLE_NAMES.issueComment:
      return TABLE_NAMES.issue;
  }
}

async function getAllParents(childTableName: string): Promise<any[]> {
  let reportedIssuesList: Issue[];
  let assignedIssuesList: Issue[];
  let uniqueList: any[] | PromiseLike<any[]>;
  switch (childTableName) {
    case TABLE_NAMES.issueAttachment:
      reportedIssuesList = await fetchIssueList('reporter', true);
      assignedIssuesList = await fetchIssueList('assignee', true);
      uniqueList = removeDuplicates(reportedIssuesList, assignedIssuesList);
      return uniqueList;
    case TABLE_NAMES.issueComment:
      reportedIssuesList = await fetchIssueList('reporter', true);
      assignedIssuesList = await fetchIssueList('assignee', true);
      uniqueList = removeDuplicates(reportedIssuesList, assignedIssuesList);
      return uniqueList;
  }
}

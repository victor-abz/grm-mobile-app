import NetInfo from '@react-native-community/netinfo';
import { BaseLocalRepository } from '../../repositories/shared/BaseLocalRepository';
import { BaseRemoteRepository } from '../../repositories/shared/BaseRemoteRepository';
import type { Database, DirtyRaw, Model } from '@nozbe/watermelondb';
import { SyncTableChangeSet } from '@nozbe/watermelondb/sync';
import { issueStatusTableSchema } from '../../migrations/v1/issue_status';
import { issueCategoryTableSchema } from '../../migrations/v1/issue_category';
import { issueTypeTableSchema } from '../../migrations/v1/issue_type';
import { issueTableSchema } from '../../migrations/v1/issue';
import { RawRecord } from '@nozbe/watermelondb';
import { TABLE_NAMES } from '../../migrations/tableName';

export class BaseService<T> {
  constructor(
    private localRepository: BaseLocalRepository<T>,
    private remoteRepository: BaseRemoteRepository<T>
  ) {}

  async upsert(item: Model): Promise<void> {
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      try {
        const modelInterface = this.localRepository.fromLocalToRemote(item);
        // Try to create on remote, if fails due to existence, update instead
        try {
          await this.remoteRepository.create(modelInterface);
        } catch (createErr: any) {
          // If already exists, update instead
          await this.remoteRepository.update(modelInterface.id, modelInterface);
        }
        // @ts-ignore
        item.syncAt = new Date();
        // Upsert locally using WatermelonDB
        await this.localRepository.upsert(item);
      } catch (err) {
        console.warn('[BaseService] Remote sync failed. Will retry later.', err);
      }
    } else {
      // Offline: upsert locally
      await this.localRepository.upsert(item);
    }
  }

  async getAll(endpointType: string | null = null): Promise<T[]> {
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      try {
        return await this.remoteRepository.fetchAll(endpointType, null, null, null, null, null, null);
      } catch (err) {
        console.warn('[BaseService] Remote sync failed. Will retry later.', err);
        console.log('[BaseService] Remote sync failed. Will retry later.', err);
        return await this.localRepository.getAll(null, null, null, null);
      }
    } else {
      const localRepositoryResults = await this.localRepository.getAll(null, null, null, null);
      console.log('localRepositoryResults', localRepositoryResults);

      return localRepositoryResults;
    }
  }

  async pullChanges({ tableName, lastPulledAt, schema, endPointType = null }): Promise<{
    changes: { [key: string]: { deleted: any[]; created: RawRecord[]; updated: any[] } };
    timestamp: number;
  }> {
    let changes = {};
    changes[tableName] = { created: [], updated: [], deleted: [] };
 
    const timestamp = Date.now();
    const tableChanges = changes[tableName];
    //remove extra statuses , test status id match, convert ids to remote ids

    // // 1. Fetch newly created records
    const newRecords = await this.remoteRepository.fetchAll(
      endPointType,
      null,
      null,
      null,
      lastPulledAt,
      null,
      null
    );
    
    // @ts-ignore
    tableChanges.created = newRecords.map(record => {
      return { id: String(record.id), ...record }
    });
    
    // 2. Fetch updated records
    // @ts-ignore
    tableChanges.updated = updatedRecords.map((record) => ({ id: new String(record.id), ...record }));

    // 3. Fetch deleted records (soft deletes are highly recommended for this)
    const deletedRecords = await this.remoteRepository.fetchAll(null, null, null, null, null, null, lastPulledAt);

    // Return all changes and the timestamp for the next pull
    return { changes, timestamp };
  }

  async pushChanges({ changes, lastPulledAt }): Promise<void> {
    const tableName = this.localRepository.tableName;
    const tableChanges = changes[tableName];

    if (!tableChanges) {
      return;
    }

    // Handle created records
    if (tableChanges.created.length > 0) {
      console.log(`Pushing ${tableChanges.created.length} new records to ${tableName}`);
      for (const record of tableChanges.created) {
        await this.remoteRepository.create(record);
      }
    }

    // Handle updated records
    if (tableChanges.updated.length > 0) {
      console.log(`Pushing ${tableChanges.updated.length} updated records to ${tableName}`);
      for (const record of tableChanges.updated) {
        await this.remoteRepository.update(record.id, record);
      }
    }

    // Handle deleted records
    if (tableChanges.deleted.length > 0) {
      console.log(`Pushing ${tableChanges.deleted.length} deletions to ${tableName}`);
      for (const recordId of tableChanges.deleted) {
        await this.remoteRepository.delete(recordId);
      }
    }
  }
}

export interface TableChangesAdapter {
  // handles pulled changes
  toLocal(changes: SyncTableChangeSet, database: Database): Promise<SyncTableChangeSet>;
  // handles pushing changes
  toRemote(changes: SyncTableChangeSet, database: Database): Promise<SyncTableChangeSet>;
}

export class HandleLocalRecordsAdapter implements TableChangesAdapter {
  // if a server record has a localId, add the localId to deleted to delete local record
  toLocal(changes: SyncTableChangeSet): Promise<SyncTableChangeSet> {
    if (changes && changes.created) {
      changes.created.forEach((record: DirtyRaw) => {
        if (record.localId) {
          if (!changes.deleted) {
            changes.deleted = [];
          }
          changes.deleted.push(record.localId);
        }
        return record;
      });
    }
    return Promise.resolve(changes);
  }

  // if a local record is created, add a localId to keep track of the record on the next pulling
  toRemote(changes: SyncTableChangeSet): Promise<SyncTableChangeSet> {
    if (changes && changes.created) {
      changes = {
        ...changes,
        created: changes.created.map((record: DirtyRaw) => {
          return {
            ...record,
            localId: record.id,
            id: null, // use null to be compatible with non-string server id
          };
        }),
        };
    }
    return Promise.resolve(changes);
  }
}
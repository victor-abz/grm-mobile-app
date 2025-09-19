import NetInfo from '@react-native-community/netinfo';
import { BaseLocalRepository } from '../../repositories/shared/BaseLocalRepository';
import { BaseRemoteRepository } from '../../repositories/shared/BaseRemoteRepository';
import type { Database, DirtyRaw, Model } from '@nozbe/watermelondb';
import { SyncTableChangeSet } from '@nozbe/watermelondb/sync';
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
        
        let createdResponse;
        let updatedResponse;
        
        try {
          createdResponse = await this.remoteRepository.create(modelInterface);
         
        } catch (createErr: any) {
          // If already exists, update instead
         
          updatedResponse = await this.remoteRepository.update(modelInterface.id, modelInterface);
        }
        // @ts-ignore
        item.syncAt = new Date();
        // Upsert locally using WatermelonDB
        
        if (createdResponse) {
          // TODO: Use newly created id from backend response to upsert
            if (createdResponse.data) {
            createdResponse.data.syncAt = new Date();
            }
          const formattedItem = this.localRepository.fromRemoteToLocal(createdResponse.data)
            await this.localRepository.upsert(item);
          
        } else if (updatedResponse) {
            if (updatedResponse.data) {
              updatedResponse.data.syncAt = new Date();
            }
          await this.localRepository.upsert(item);
        } else {
          await this.localRepository.upsert(item);
        }
        console.log("Succesfully Updated Watermelon DB");
        

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
       
        const results = await this.localRepository.getAll(null, null, null, null);
       
        return results
      }
    } else {
      try {
        const localRepositoryResults = await this.localRepository.getAll(null, null, null, null);
        
        
        return localRepositoryResults; 
      } catch (error) {
      
      }
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

    const rawRecords = newRecords.map((item) => this.localRepository.fromRemoteToLocal(item));
    console.log('formatted records', rawRecords[0]);
    // response log: {"administrative_region": {"administrative_id": "1", "name": "sample administrative region"}, "assignee": "{\"id\":4,\"name\":\"Comité village Representative\"}", "category": "{\"id\":1,\"name\":\"sample category\"}", "citizen": undefined, "component": undefined, "id": 432432, "intake_date": "2025-08-19T00:51:27.330758Z", "issue_sub_type": undefined, "issue_type": "{\"id\":1,\"name\":\"type 1\"}", "reporter": "{\"id\":5,\"name\":\"Test Representative\"}", "status": "{\"id\":4,\"name\":\"Sample status 4\",\"final_status\":false,\"initial_status\":false,\"rejected_status\":true,\"open_status\":false}", "sub_component": undefined, "tracking_code": "string"}
    // @ts-ignore
    tableChanges.created = rawRecords.map((record) => {
      return { ...record, id: String(record.id) };
    });

    console.log("TABLE NAME:", tableName, endPointType);
    console.log(tableChanges.created.length);
    

    // 2. Fetch updated records
    // const updatedRecords = []
    // // const updatedRecords = await this.remoteRepository.fetchAll(endPointType, null, null, null, null, lastPulledAt, null);
    // // @ts-ignore
    // tableChanges.updated = updatedRecords.map((record) => ({
    //   id:  String(record.id),
    //   ...record,
    // }));

    // // 3. Fetch deleted records (soft deletes are highly recommended for this)
    // const deletedRecords = await this.remoteRepository.fetchAll(
    //   endPointType,
    //   null,
    //   null,
    //   null,
    //   null,
    //   null,
    //   lastPulledAt
    // );

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

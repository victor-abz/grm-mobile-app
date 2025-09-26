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
            createdResponse.data.syncAt = JSON.stringify(new Date());
            }
          const formattedItem = this.localRepository.fromRemoteToLocal(createdResponse.data)
            await this.localRepository.upsert(item);
          
        } else if (updatedResponse) {
            if (updatedResponse.data) {
              updatedResponse.data.syncAt = JSON.stringify(new Date());
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
    try {
      const newRecords = await this.remoteRepository.fetchAll(
        endPointType,
        null,
        null,
        null,
        lastPulledAt,
        null,
        null
      );
      const formattedRecords = newRecords.map((item) => this.localRepository.fromRemoteToLocal(item));
      tableChanges.created = formattedRecords.map((record) => {
        return { ...record, id: String(record.id) };
      });
    } catch (e) {
      console.error("Catch pulling created changes", e);
      tableChanges.created = []
    }

    // 2. Fetch updated records
    try {
      const updatedRecords = await this.remoteRepository.fetchAll(endPointType, null, null, null, null, lastPulledAt, null);
      const formattedRecords = updatedRecords.map((item) =>
        this.localRepository.fromRemoteToLocal(item)
      );
      tableChanges.updated = formattedRecords.map((record) => ({
          ...record,
          id:  String(record.id),
        }
      ));

    } catch (error) {
      console.error('Catch pulling updated changes', error);
      tableChanges.updated = [];
    }

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
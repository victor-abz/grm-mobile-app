import type { Model } from '@nozbe/watermelondb';
import { RawRecord } from '@nozbe/watermelondb';
import NetInfo from '@react-native-community/netinfo';
import { BaseLocalRepository } from '../../repositories/shared/BaseLocalRepository';
import { BaseRemoteRepository } from '../../repositories/shared/BaseRemoteRepository';
import { TABLE_NAMES } from '../../migrations/tableName';

export class BaseService<T> {
  constructor(
    private localRepository: BaseLocalRepository<T>,
    private remoteRepository: BaseRemoteRepository<T>
  ) { }
  
  async bulkCreate(entries: T[]): Promise<void> {
    // check if any conversion is needed 
    // for (let index = 0; index < entries.length; index++) {
    //   const element = entries[index];
    //   this.localRepository.fromRemoteToLocal(element)
    // }
    this.localRepository.bulkCreate(entries)
  }

  async upsert(item: Model): Promise<void> {
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      try {
        console.log('Try to create on remote, if fails due to existence, update instead', item);
        
        const modelInterface = this.localRepository.fromLocalToRemote(item);
        // Try to create on remote, if fails due to existence, update instead
        console.log("model interface:", modelInterface);
        
        let createdResponse;
        let updatedResponse;
        
        try {
          createdResponse = await this.remoteRepository.create(modelInterface);
          
          console.log("Remote Create successful");
        } catch (createErr: any) {
          // If already exists, update instead
          console.log("Couldn't create, procceed with Update");
          updatedResponse = await this.remoteRepository.update(modelInterface.id, modelInterface);
          console.log(updatedResponse ? "Remote Update successful" : "Failed to update remotely");
        }
        // @ts-ignore
        item.syncAt = new Date();
        // Upsert locally using WatermelonDB
        
        if (createdResponse) {
          // TODO: Use newly created id from backend response to upsert
          console.log("CREATED RESPONSE - (Currently not being used as an entry to watermelon)", createdResponse);
            if (createdResponse.data) {
            createdResponse.data.syncAt = JSON.stringify(new Date());
            }
          // const formattedItem = this.localRepository.fromRemoteToLocal(createdResponse.data)
          return await this.localRepository.upsert(item);
          
        } else if (updatedResponse) {
          //TODO: Use newly created id in new sub-items from backend response to upsert
            if (updatedResponse.data) {
              updatedResponse.data.syncAt = JSON.stringify(new Date());
            }
          
          
            console.log(
              'UPDATED RESPONSE - (Currently not being used as an entry to watermelon)',
              updatedResponse.data
            );
          
          return await this.localRepository.upsert(item);
        } else {
          console.log("Nothing in response from the backend to upsert locally, proceeding to use local modified item:", item);
        
          return await this.localRepository.upsert(item);
        }        

      } catch (err) {
        console.warn('[BaseService] Remote sync failed. Will retry later.', err);
      }
    } else {
      // Offline: upsert locally
     
      return await this.localRepository.upsert(item);
    }
  }

  async getAll(
    parentId: string | null = null,
    endpointType: string | null = null,
    fetchFromLocal: boolean | null = null,
    page: number | null = null,
    allPages: boolean | null = null,
  ): Promise<T[]> {
    
    const state = await NetInfo.fetch();
    if (this.localRepository.tableName == TABLE_NAMES.issue)
      
      console.log('GET ALL [BaseService] Fetch All');
      
    if (state.isConnected && !fetchFromLocal) {
      try {
        return await this.remoteRepository.fetchAll(endpointType, null, null, page, null, allPages, null, null, null, parentId);
      } catch (err) {
        console.warn('[BaseService] Remote sync failed. Will retry later. Proceeding with local retrieval', err);
        return await this.localRepository.getAll(null, null, null, null, parentId);
      }
    } else {
      return await this.localRepository.getAll(null, null, null, null, parentId);
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
        null,
        null,
        lastPulledAt,
        null,
        null,
        null
      );

      // fetch only once if without date support at list endpoint
      const formattedRecords = newRecords.map((item) => this.localRepository.fromRemoteToLocal(item));
      tableChanges.created = formattedRecords.map((record) => ({
          ...record,
          id: String(record.id) 
         }
      ));
    } catch (e) {
      console.error("Catch pulling created changes", e);
      tableChanges.created = []
    }

    // 2. Fetch updated records

    if (lastPulledAt != null) {
      try {

        const updatedRecords = await this.remoteRepository.fetchAll(endPointType, null, null, null, null, null, null, lastPulledAt, null, null);


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
      
    }
    return { changes, timestamp };
  }

  async pushChanges({ changes, lastPulledAt }): Promise<void> {
    const tableName = this.localRepository.tableName;
    console.log("tablename",tableName);
    
    const tableChanges = changes[tableName];
    console.log("table changes",tableChanges);

    if (!tableChanges) {
      return;
    }

    // Handle created records
    if (tableChanges.created.length > 0) {
      console.log(tableChanges.created.map((value) => value.id));
      console.log(tableChanges.created);
      console.log(`Pushing ${tableChanges.created.length} new records to ${tableName}`);
      for (const record of tableChanges.created) {
        const modelInterface = this.localRepository.fromLocalToRemote(record);
        await this.remoteRepository.create(modelInterface);
      }
    }

    // Handle updated records
    if (tableChanges.updated.length > 0) {
      console.log(`Pushing ${tableChanges.updated.length} updated records to ${tableName}`);    
      for (const record of tableChanges.updated) {
        const modelInterface = this.localRepository.fromLocalToRemote(record);
        await this.remoteRepository.update(modelInterface.id, modelInterface);
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
import type { Model } from '@nozbe/watermelondb';
import { RawRecord } from '@nozbe/watermelondb';
import NetInfo from '@react-native-community/netinfo';
import { BaseLocalRepository } from '../../repositories/shared/BaseLocalRepository';
import { BaseRemoteRepository } from '../../repositories/shared/BaseRemoteRepository';
import { TABLE_NAMES } from '../../migrations/tableName';
import { SortOrder } from '@nozbe/watermelondb/QueryDescription';

export class BaseService<T> {
  createdRecordsPushed: [unknown, string][] = [];
  constructor(
    private localRepository: BaseLocalRepository<T>,
    private remoteRepository: BaseRemoteRepository<T>
  ) {}

  async bulkCreate(entries: T[]): Promise<void> {
    // check if any conversion is needed
    // for (let index = 0; index < entries.length; index++) {
    //   const element = entries[index];
    //   this.localRepository.fromRemoteToLocal(element)
    // }

    //TODO: ADD GLOBAL LOADING
    this.localRepository.bulkCreate(entries);
  }

  async upsert(item: Model): Promise<void> {
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      try {
        console.log('Try to create on remote, if fails due to existence, update instead', item);

        const modelInterface = this.localRepository.fromLocalToRemote(item);
        // Try to create on remote, if fails due to existence, update instead
        console.log('model interface:', modelInterface);

        let createdResponse;
        let updatedResponse;

        try {
          createdResponse = await this.remoteRepository.create(modelInterface);
          if (createdResponse) {
            console.log('Remote Create successful');
          } else {
            console.log("Couldn't create, proceed with Update");
            updatedResponse = await this.remoteRepository.update(modelInterface.id, modelInterface);
            console.log(updatedResponse ? 'Remote Update successful' : 'Failed to update remotely');
          }
        } catch (createErr: any) {
          // If already exists, update instead
          console.log("Couldn't create, proceed with Update. Reason: ", createErr);
          updatedResponse = await this.remoteRepository.update(modelInterface.id, modelInterface);
          console.log(updatedResponse ? 'Remote Update successful' : 'Failed to update remotely');
        }

        // @ts-ignore
        item.syncAt = new Date();
        // Upsert locally using WatermelonDB

        if (createdResponse) {
          // TODO: Use newly created id from backend response to upsert
          console.log(
            'CREATED RESPONSE - (Currently not being used as an entry to watermelon)',
            createdResponse
          );
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
          console.log(
            'Nothing in response from the backend to upsert locally, proceeding to use local modified item:',
            item
          );

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
    forceFetchFromLocal: boolean | null = null,
    page: number | null = null,
    allPages: boolean | null = null,
    sortBy: string = null,
    sortOrder: SortOrder = null
  ): Promise<T[]> {
    const state = await NetInfo.fetch();
    if (this.localRepository.tableName == TABLE_NAMES.issue)
      console.log('GET ALL [BaseService] Fetch All');

    if (state.isConnected && !forceFetchFromLocal) {
      try {
        const remoteResult = await this.remoteRepository.fetchAll(
          endpointType,
          null,
          null,
          page,
          null,
          allPages,
          null,
          null,
          null,
          parentId
        );
        if (Array.isArray(remoteResult)) {
          return remoteResult;
        } else {
          console.warn(
            '[BaseService] Remote sync failed. Will retry later. Proceeding with local retrieval'
          );
          return await this.localRepository.getAll(sortBy, sortOrder, null, null, parentId);
        }
      } catch (err) {
        console.warn(
          '[BaseService] Remote sync failed. Will retry later. Proceeding with local retrieval. Reason: '
        );
        return await this.localRepository.getAll(sortBy, sortOrder, null, null, parentId);
      }
    } else {
      return await this.localRepository.getAll(sortBy, sortOrder, null, null, parentId);
    }
  }

  async pullChanges({
    tableName,
    lastPulledAt,
    schema,
    endPointType = null,
    forceFetchAllPages = null,
  }): Promise<{
    changes: { [key: string]: { deleted: any[]; created: RawRecord[]; updated: any[] } };
    timestamp: number;
  }> {
    let changes = {};
    changes[tableName] = { created: [], updated: [], deleted: [] };

    const timestamp = Date.now();
    const tableChanges = changes[tableName];


    // // 1. Fetch newly created records
    try {
      const newRecords = await this.remoteRepository.fetchAll(
        endPointType,
        null,
        null,
        null,
        null,
        forceFetchAllPages,
        lastPulledAt,
        null,
        null,
        null
      );

     
      const formattedRecords = newRecords.map((item) =>
        this.localRepository.fromRemoteToLocal(item)
      );

      // Saving at updated due to the sendCreatedAsUpdated flag
      tableChanges.updated = formattedRecords.map((record) => ({
        ...record,
        id: String(record.id),
      }));
    } catch (e) {
      console.error('Catch pulling created changes', e);
      tableChanges.updated = [];
    }

    // 2. Fetch updated records

    if (lastPulledAt != null) {
      try {
        const updatedRecords = await this.remoteRepository.fetchAll(
          endPointType,
          null,
          null,
          null,
          null,
          forceFetchAllPages,
          null,
          lastPulledAt,
          null,
          null
        );

        const formattedRecords = updatedRecords.map((item) =>
          this.localRepository.fromRemoteToLocal(item)
        );

        // tableChanges.updated = []
        tableChanges.updated = [
          ...tableChanges.updated,
          ...formattedRecords.map((record) => ({
            ...record,
            id: String(record.id),
          })),
        ];
      } catch (error) {
        console.error('Catch pulling updated changes', error);
        
      }
 
      // Replace local element's ID with the newly created backend ID
      let itemsToDelete= [];
      
      if (this.createdRecordsPushed.length > 0 && endPointType == 'reporter') {
        itemsToDelete = this.getItemsToDelete()
        
        this.createdRecordsPushed = [];  
      } 
        
      tableChanges.deleted = [...itemsToDelete];

    
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

  getItemsToDelete(): string[] {
    let itemsToDelete = []
    
    for (const element of this.createdRecordsPushed) {
      itemsToDelete = [...itemsToDelete, element[1]];
    }
    
    return itemsToDelete;
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
        
        // Prepare the  record to be handled by the remote repository
        const modelInterface = this.localRepository.fromLocalToRemote(record);
        
        // Create the element remotely
        try {
          const createdResponse = await this.remoteRepository.create(modelInterface);
          
          if (!createdResponse) {
            throw new Error('Error creating element at remote while syncing');
          }       
          
          // Register the new local and server ids to be replaced on the next pull
          this.createdRecordsPushed = [...this.createdRecordsPushed, [createdResponse, record.id]];
          
        } catch (error) {
          throw new Error('Error creating element at remote while syncing. Reason: ', error);
        }
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
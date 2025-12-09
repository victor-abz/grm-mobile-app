import type { Model } from '@nozbe/watermelondb';
import { Q, RawRecord } from '@nozbe/watermelondb';
import NetInfo from '@react-native-community/netinfo';
import { BaseLocalRepository } from '../../repositories/shared/BaseLocalRepository';
import { BaseRemoteRepository } from '../../repositories/shared/BaseRemoteRepository';
import { SortOrder } from '@nozbe/watermelondb/QueryDescription';
import { syncServiceInstance } from './SyncService';
export type WatermelonId = string;
export type CreatedResponseWithBackendId = unknown;

export class BaseService<T> {
  createdRecordsPostPushedWithNewBackendIDs: [CreatedResponseWithBackendId, WatermelonId][] = [];

  constructor(
    private localRepository: BaseLocalRepository<T>,
    private remoteRepository: BaseRemoteRepository<T>
  ) {
    
  }

  async bulkCreate(entries: T[]): Promise<void> {
    // check if any conversion is needed
    // for (let index = 0; index < entries.length; index++) {
    //   const element = entries[index];
    //   this.localRepository.fromRemoteToLocal(element)
    // }

    //TODO: ADD GLOBAL LOADING
    this.localRepository.bulkCreate(entries);
  }

  async replaceParentIdProperty(idsToReplace: [CreatedResponseWithBackendId, WatermelonId][]) {
    try {
      const replacedItems: Model[] = [];

      for (let index = 0; index < idsToReplace.length; index++) {

        const parent = idsToReplace[index];

        // 1. Get all children with the old parent_id

        const dbInstance = syncServiceInstance.database;
        const children = await dbInstance
          .get(this.localRepository.tableName)
          .query(Q.where('parent_id', Q.eq(parent[1])))
          .fetch();

        // 2. Update each child to use the new parent_id
        
        for (const child of children) {

          const item = await this.localRepository.update(
                child,
                {
                  parent_id: parent[0]?.data?.id,
                  // synced_at: Date.now(),
                  // status
                },
                'created'
              )
            
          replacedItems.push(item)
        }
      }

      return replacedItems
    } catch (error) {
      return { error: `Error updating parent ID's. Reason: ${error} ` };
    }
  }
  async upsert(item: Model): Promise<void> {
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      try {
        console.log('Try to create on remote, if fails due to existence, update instead', item);

        const modelInterface = this.localRepository.fromLocalToRemote(item);
        // Try to create on remote, if fails due to existence, update instead
        console.log('model interface:', modelInterface);

        let createdResponse: Awaited<T>;
        let updatedResponse: Awaited<T>;

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

          return await this.localRepository.upsert(item, createdResponse?.data?.id);
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
    parentIds = null,
  }): Promise<{
    changes: { [key: string]: { deleted: any[]; created: RawRecord[]; updated: any[] } };
    timestamp: number;
    createdRecordsPostPushedWithNewBackendIDs: [CreatedResponseWithBackendId, WatermelonId][];
  }> {
    
    let timestamp = Date.now()
    
    // LIST PARENT IDS TO FETCH EVERY PAGE AND HYDRATE THE APP WITH ATTACHMENTS. OTHERWISE,
    // BUILD A HANDLER TO FETCH THEM WHEN CONNECTIVITY IS AVAILABLE
    const { changes, createdRecordsPostPushedWithNewBackendIDs} = await this.buildChangesObject(
      tableName,
      endPointType,
      forceFetchAllPages,
      lastPulledAt,
      (parentIds = parentIds ?? null)
    );

    return {
      changes,
      timestamp,
      createdRecordsPostPushedWithNewBackendIDs,
    };
  }

  private async buildChangesObject(
    tableName: string,
    endPointType: any,
    forceFetchAllPages: any,
    lastPulledAt: any,
    parentIds?: { created: any[]; updated: any[]; deleted: string[] }
  ) {
    
    // endpoints to skip id-replacement (items not being created locally)
    const disallowedEndpointTypes = ['assignee'];
    const isEndpointTypeAllowed = !disallowedEndpointTypes.includes(
      String(endPointType ?? '').toLowerCase()
    );
    let changes = {};
    changes[tableName] = { created: [], updated: [], deleted: [] };
    const tableChanges = changes[tableName];
    let syncPullFailed = false;
    let createdRecordsPostPushedWithNewBackendIDs = [];
    
    // 1. Fetch newly created records
    
    if (parentIds) {
      // Parent IDs available - Pulling sub-items

      try {
        let newRecords = [];
        let updatedRecords = [];
        for (const parent of parentIds.created) {
          newRecords = await this.remoteRepository.fetchAll(
            endPointType,
            null,
            null,
            null,
            null,
            forceFetchAllPages,
            lastPulledAt,
            null,
            null,
            parent.id ?? null
          );
        }

        const createdFormattedRecords = newRecords.map((item) =>
          this.localRepository.fromRemoteToLocal(item)
        );

        // Saving at updated due to the sendCreatedAsUpdated flag
        tableChanges.updated = createdFormattedRecords.map((record) => ({
          ...record,
          id: String(record.id),
        }));

        for (const parent of parentIds.updated) {
          updatedRecords = await this.remoteRepository.fetchAll(
            endPointType,
            null,
            null,
            null,
            null,
            forceFetchAllPages,
            null,
            lastPulledAt,
            null,
            parent.id ?? null
          );
        }

        const updatedFormattedRecords = updatedRecords.map((item) =>
          this.localRepository.fromRemoteToLocal(item)
        );

        // tableChanges.updated = []
        tableChanges.updated = [
          ...tableChanges.updated,
          ...updatedFormattedRecords.map((record) => ({
            ...record,
            id: String(record.id),
          })),
        ];
      } catch (error) {
        console.error('Error pulling sub-items changes (created) Reason: ', error);
        // tableChanges.updated = [];
        syncPullFailed = true;
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

      // Replace local element's ID with the newly created backend ID

      for (const parent of parentIds.deleted) {
        let itemsToDeleteWithWatermelonIds = [];

        //TODO: check if,  "handle if previous failed" exists,

        if (
          !syncPullFailed &&
          this.createdRecordsPostPushedWithNewBackendIDs.length > 0 &&
          isEndpointTypeAllowed
        ) {
          createdRecordsPostPushedWithNewBackendIDs =
            this.createdRecordsPostPushedWithNewBackendIDs;
          itemsToDeleteWithWatermelonIds = this.getItemsToDelete();

          this.createdRecordsPostPushedWithNewBackendIDs = [];
        }

        tableChanges.deleted = [...itemsToDeleteWithWatermelonIds];
      }

      // Return all changes and the timestamp for the next pull
      return { changes };
    } else {
      // Parent IDs unavailable - Pulling parents
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
        syncPullFailed = true;
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
          syncPullFailed = true;
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

        // Replace local element's ID with the newly created backend ID
        let itemsToDeleteWithWatermelonIds = [];

        //TODO: handle if previous failed,
        //TODO: handle others rather than 'reporter' endpoint
        if (
          !syncPullFailed &&
          this.createdRecordsPostPushedWithNewBackendIDs.length > 0 &&
          isEndpointTypeAllowed
        ) {
          createdRecordsPostPushedWithNewBackendIDs =
            this.createdRecordsPostPushedWithNewBackendIDs;
          itemsToDeleteWithWatermelonIds = this.getItemsToDelete();

          this.createdRecordsPostPushedWithNewBackendIDs = [];
        }

        tableChanges.deleted = [...itemsToDeleteWithWatermelonIds];

        // Return all changes and the timestamp for the next pull
      }

      return { changes, createdRecordsPostPushedWithNewBackendIDs };
    }
  }

  getItemsToDelete(): string[] {
    let itemsToDelete = [];

    for (const element of this.createdRecordsPostPushedWithNewBackendIDs) {
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

          console.log('CREATED', tableChanges.created);

          // Register the new local and server ids to be replaced on the next pull
          this.createdRecordsPostPushedWithNewBackendIDs = [
            ...this.createdRecordsPostPushedWithNewBackendIDs,
            [createdResponse, record.id],
          ];
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
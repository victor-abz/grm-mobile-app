import type { Model } from '@nozbe/watermelondb';
import { Q, RawRecord } from '@nozbe/watermelondb';
import NetInfo from '@react-native-community/netinfo';
import { BaseLocalRepository, LatestValueAtCurrentPage } from '../../repositories/shared/BaseLocalRepository';
import { BaseRemoteRepository } from '../../repositories/shared/BaseRemoteRepository';
import { SortOrder } from '@nozbe/watermelondb/QueryDescription';
import { TABLE_NAMES } from '../../migrations/tableName';
import { deleteAsync } from 'expo-file-system';
import { SyncStatus } from '@nozbe/watermelondb/Model';
import { databaseServiceInstance } from '../../utils/storageManager';
import { OfflinePaginatedListRequest } from '../../hooks/issues/useIssue';
export type WatermelonId = string;
export type CreatedResponseWithBackendId = unknown;

export type EndOfList = {
  detail: string;
};

export type OfflinePagingInitialTrackingInfo<T> = {
  fieldName: string;
  latestValue: T;
};

export class BaseService<T> {
  createdRecordsPostPushedWithNewBackendIDs: [CreatedResponseWithBackendId, WatermelonId][] = [];
  private isFile: boolean;

  forcePaginateFromLocalNoAccessToBackendList = false;
  constructor(
    private localRepository: BaseLocalRepository<T>,
    private remoteRepository: BaseRemoteRepository<T>
  ) {
    this.isFile = this.checkIfFile();
  }

  private getPathFieldName(): string {
    switch (this.localRepository.tableName) {
      case TABLE_NAMES.issueAttachment:
        return 'local_url';
      default:
        return '';
    }
  }

  private checkIfFile(): boolean {
    switch (this.localRepository.tableName) {
      case TABLE_NAMES.issueAttachment:
        return true;
      default:
        return false;
    }
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

  async replaceParentIdProperty(
    idsToReplace: [CreatedResponseWithBackendId, WatermelonId][],
    status: SyncStatus = 'updated'
  ) {
    try {
      const replacedItems: Model[] = [];

      for (let index = 0; index < idsToReplace.length; index++) {
        const parent = idsToReplace[index];

        // 1. Get all children with the old parent_id

        const dbInstance = databaseServiceInstance.database;
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
            },
            status
          );

          replacedItems.push(item);
        }
        console.log('Successfully replaced parent ids');
      }

      return replacedItems;
    } catch (error) {
      return { error: `Error updating parent ID's. Reason: ${error} ` };
    }
  }

  /**
   * Upsert an item both locally and (when possible) remotely.
   *
   * Behavior:
   * - Converts the WatermelonDB model to the remote payload using localRepository.fromLocalToRemote.
   * - If online: tries to create on the remote; on create failure (already exists or error) it falls back to update.
   * - On successful remote create/update it stamps sync metadata and upserts the local record.
   *   - When a remote create returns a new backend id (response.data.id), that id is passed to localRepository.upsert
   *     so the local record can be reconciled with the server id.
   * - If offline or remote operations fail, the method upserts the item locally so it can be synced later.
   *
   * Expectations / Notes:
   * - remoteRepository.create/update should return an object with .data.id when a server id is available.
   * - localRepository.upsert accepts a WatermelonDB Model and an optional backend id to reconcile ids.
   * - This method sets a sync timestamp on the model before calling local upsert.
   *
   * @param item WatermelonDB Model instance to upsert
   * @returns Promise<void>
   */
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

        // UPSERT ON REMOTE
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

        // UPSERT LOCALLY USING WATERMELONDB
        if (createdResponse) {
          console.log(
            'CREATED RESPONSE - (Currently not being used as an entry to watermelon)',
            createdResponse
          );
          if (createdResponse.data) {
            createdResponse.data.syncAt = JSON.stringify(new Date());
          }
          return await this.localRepository.upsert(item, createdResponse?.data?.id);
        } else if (updatedResponse) {
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
          console.log('##########');
          const a = await this.localRepository.upsert(item);
          console.log(a);
          
          return a
        }
      } catch (err) {
        console.warn('[BaseService] Upsert failed. Reason: ', err);
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
          this.forcePaginateFromLocalNoAccessToBackendList = false;
          return remoteResult;
        } else {
          this.forcePaginateFromLocalNoAccessToBackendList = true;
          
          console.warn(
            '[BaseService] Remote sync failed. Will retry later. Proceeding with local retrieval'
          );

          return await this.localRepository.getAll(
            sortBy,
            sortOrder,
            null,
            null,
            parentId,
            null,
            null
          );
        }
      } catch (err) {
        this.forcePaginateFromLocalNoAccessToBackendList = true;
        console.warn(
          '[BaseService] Remote sync failed. Will retry later. Proceeding with local retrieval. Reason: '
        );
        return await this.localRepository.getAll(
          sortBy,
          sortOrder,
          null,
          null,
          parentId,
          null,
          null
        );
      }
    } else {
      this.forcePaginateFromLocalNoAccessToBackendList = true;
      return await this.localRepository.getAll(sortBy, sortOrder, null, null, parentId, null, null);
    }
  }

  async getMore(
    endpointType: string | null,
    offlinePaginatedListRequest: OfflinePaginatedListRequest,
    offlinePagingInitialTrackingInfo?: OfflinePagingInitialTrackingInfo<T>,
  ): Promise<{result: T[], from: 'online' | 'offline'}> {
    const { latestValue, fieldName } = offlinePagingInitialTrackingInfo ?? {};
    try {
      console.log('FORCE TO OFFLINE PAGINATE: ', this.forcePaginateFromLocalNoAccessToBackendList);

      const state = await NetInfo.fetch();
      if (state.isConnected) { 
        
        //if error offline
      } else {

      }

      // Fetch From Remote
      if (!this.forcePaginateFromLocalNoAccessToBackendList) {
        const remoteResult = await this.remoteRepository.fetchMore(endpointType);
        if (Array.isArray(remoteResult)) {
          
          return {result: remoteResult, from: 'online'};
        } else {
          console.log('LOCAL PAGINATION');
          // Fetch From Local From Latest Value

          // [] Fetch, disconnect, fetch from local, maybe lastvalue does not exist, bring from zero, locally.
          // [] review unstable connection detector.



          const latestValueAtCurrentPage = {
            fieldName,
            latestValue
          };
          
          this.forcePaginateFromLocalNoAccessToBackendList = true;
          // Call Paging With Latest Value Removed To Query With Q.Lte
          const list = await this.localRepository.getAll(
            'intake_date',
            'desc',
            offlinePaginatedListRequest.pageSize, 
            null,
            null,
            offlinePaginatedListRequest.nextPage,
            latestValueAtCurrentPage
          );
          return {result: list, from: 'offline'};
          
        }
      } else {
        // Fetch From Local Regular Slice Paging, Except if offline current page equals 0

         const latestValueAtCurrentPage = {
           fieldName,
           latestValue
         };

        this.forcePaginateFromLocalNoAccessToBackendList = true;

        const list = await this.localRepository.getAll(
          'intake_date',
          'desc',
          offlinePaginatedListRequest.pageSize,
          null,
          null,
          offlinePaginatedListRequest.nextPage,
          offlinePaginatedListRequest.prevPage == null ? latestValueAtCurrentPage : undefined
        );

        return {result: list, from: 'offline'};
        // return list.map((i) => {
        //   return { ...i, from: 'offline' };
        // });
      }
    } catch (err) {
      if (!this.forcePaginateFromLocalNoAccessToBackendList) {
        this.forcePaginateFromLocalNoAccessToBackendList = true;
        console.error('Pagination from remote/local failed. Retrying...');
        try {
          const list = await this.getMore(
            endpointType,
            offlinePaginatedListRequest,
            offlinePagingInitialTrackingInfo
          );
          
          return {result: list.result, from: list.from};
        } catch (error) {
          console.error('Error');
          console.error(error);
        }
      } else {
        console.error('Pagination from remote/local retry failed.');
      }
    }

  }

  async pullChanges({
    tableName,
    lastPulledAt,
    schema,
    endPointType = null,
    forceFetchAllPages = null,
    parentChanges = null,
  }): Promise<{
    changes: { [key: string]: { deleted: any[]; created: RawRecord[]; updated: any[] } };
    timestamp: number;
    createdRecordsPostPushedWithNewBackendIDs: [CreatedResponseWithBackendId, WatermelonId][];
  }> {
    let timestamp = Date.now();

    const { changes, createdRecordsPostPushedWithNewBackendIDs } = await this.buildChangesObject(
      tableName,
      endPointType,
      forceFetchAllPages,
      lastPulledAt,
      (parentChanges = parentChanges ?? null)
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
    parentChanges?: { created: any[]; updated: any[]; deleted: string[] }
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

    if (parentChanges) {
      // Parent IDs available - Pulling sub-items
      console.log('Parent IDs available');

      try {
        let newRecords = [];
        let updatedRecords = [];
        for (const parent of parentChanges.created) {
          newRecords = [
            ...newRecords,
            [
              await this.remoteRepository.fetchAll(
                endPointType,
                null,
                null,
                null,
                null,
                forceFetchAllPages,
                lastPulledAt, // created_date
                null,
                null,
                parent.id ?? null
              ),
              parent.id ?? null,
            ],
          ];
        }

        const createdFormattedRecords = newRecords.map((item) => {
          const parentId = item[1];
          const subItemsList = item[0];
          for (let index = 0; index < subItemsList.length; index++) {
            const element = subItemsList[index];

            return this.localRepository.fromRemoteToLocal(element, parentId);
          }
        });

        // Saving at updated due to the sendCreatedAsUpdated flag
        tableChanges.updated = createdFormattedRecords.map((record) => ({
          ...record,
          id: String(record.id),
        }));

        for (const parent of parentChanges.updated) {
          updatedRecords = [
            ...updatedRecords,
            [
              await this.remoteRepository.fetchAll(
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
              ),
              parent.id ?? null,
            ],
          ];
        }

        const updatedFormattedRecords = updatedRecords.map((item) => {
          const parentId = item[1];
          const subItemsList = item[0];
          let formattedSubItems = [];
          for (let index = 0; index < subItemsList.length; index++) {
            const element = subItemsList[index];
            formattedSubItems.push(this.localRepository.fromRemoteToLocal(element, parentId));
          }

          return formattedSubItems;
        });

        // [11/Dec/2025 16:55:44] "POST /issues/369/add-attachment HTTP/1.1" 201 1261
        // [11/Dec/2025 16:55:44] "POST /issues/369/add-attachment HTTP/1.1" 201 1261
        // [11/Dec/2025 16:55:44] "GET /issues/369/attachments/?updated_at=2025-12-11T16%3A55%3A41.462Z HTTP/1.1" 200 2507

        tableChanges.updated = [
          ...tableChanges.updated,
          ...updatedFormattedRecords.flat().map((record) => ({
            ...record,
            id: String(record.id),
          })),
        ];
      } catch (error) {
        console.error('Error pulling sub-items changes (created) Reason: ', error);
        // tableChanges.updated = [];
        syncPullFailed = true;
      }

      //[x]permissions alert looks like stop download file ?

      //[x]check background progress in pause

      // [x]Caused by: Directory
      // 'file:///data/user/0/com.setcobj.grmapp/files//issues/397/attachments'
      // could not be created or already exists]

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

      for (const parent of parentChanges.deleted) {
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
      // tableChanges.deleted - fetch old wm items, get cache local path and delete file

      if (this.isFile) {
        for (const deleted of tableChanges.deleted) {
          try {
            const itemToDelete: Awaited<T> = await this.localRepository.findOne(deleted);
            const fieldName: string = this.getPathFieldName();
            await deleteAsync(itemToDelete[fieldName]);
          } catch (error) {
            console.error(error);
          }
        }
      }

      // Return all changes and the timestamp for the next pull
      return { changes };
    } else {
      // Parent IDs unavailable - Pulling parents
      console.log('Parent IDs unavailable - Pulling parents');

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

        const createdFormattedRecords = newRecords.map((item) =>
          this.localRepository.fromRemoteToLocal(item)
        );

        // Saving at updated due to the sendCreatedAsUpdated flag
        tableChanges.updated = createdFormattedRecords.map((record) => ({
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
        console.log('CREATED', tableChanges.updated);
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
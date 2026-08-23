import type { Model } from '@nozbe/watermelondb';
import { Q, RawRecord } from '@nozbe/watermelondb';
import NetInfo from '@react-native-community/netinfo';
import { BaseLocalRepository, LocalGetAllEventInfo, LatestValueAtCurrentPage } from '../../repositories/shared/BaseLocalRepository';
import { BaseRemoteRepository } from '../../repositories/shared/BaseRemoteRepository';
import { SortOrder } from '@nozbe/watermelondb/QueryDescription';
import { TABLE_NAMES } from '../../migrations/tableName';
import { deleteAsync } from 'expo-file-system';
import { SyncStatus } from '@nozbe/watermelondb/Model';
import { databaseServiceInstance } from '../../utils/storageManager';
import type { OfflinePagingInitialTrackingInfo, OfflinePaginatedListRequestControls } from './types';

export type WatermelonId = string;
export type CreatedResponseWithBackendId = unknown;

class WatermelonController {
  isManuallyUpdating = false;
}

export const watermelonController = new WatermelonController();

export type EndOfList = {
  detail: string;
};

export class BaseService<T> {
  createdRecordsPostPushedWithNewBackendIDs: [CreatedResponseWithBackendId, WatermelonId][] = [];
  private isFile: boolean;

  forcePaginateFromLocalNoAccessToBackendList = false;
  constructor(
    private localRepository: BaseLocalRepository<T>,
    private remoteRepository: BaseRemoteRepository<T>
  ) {
    this.isFile = this.checkIfTableContainsFiles();
  }

  private getPathFieldName(): string {
    switch (this.localRepository.tableName) {
      case TABLE_NAMES.issueAttachment:
        return 'local_url';
      default:
        return '';
    }
  }

  private checkIfTableContainsFiles(): boolean {
    switch (this.localRepository.tableName) {
      case TABLE_NAMES.issueAttachment:
        return true;
      default:
        return false;
    }
  }

  async bulkCreate(entries: T[]): Promise<void> {
    let formattedEntries = entries.slice();
    for (let index = 0; index < entries.length; index++) {
      const element = formattedEntries[index];
      formattedEntries[index] = this.localRepository.fromRemoteToLocal(element);
    }
    this.localRepository.bulkCreate(formattedEntries);
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

  async upsert(item: Model): Promise<any | null> {
    // if(!syncServiceInstance.) { return }
    watermelonController.isManuallyUpdating = true;
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
            console.log('✅ Remote Create successful');
          } else {
            console.log("Couldn't create, proceed with Update");
            updatedResponse = await this.remoteRepository.update(modelInterface.id, modelInterface);
            console.log(
              updatedResponse ? '✅ Remote Update successful' : 'Failed to update remotely'
            );
          }
        } catch (createErr: any) {
          // If already exists, update instead
          console.log("Couldn't create, proceed with Update. Reason: ", createErr);
          updatedResponse = await this.remoteRepository.update(modelInterface.id, modelInterface);
          console.log(
            updatedResponse ? '✅ Remote Update successful' : 'Failed to update remotely'
          );
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
          watermelonController.isManuallyUpdating = false;
          return await this.localRepository.upsert(item, createdResponse?.data?.id);
        } else if (updatedResponse) {
          if (updatedResponse.data) {
            updatedResponse.data.syncAt = JSON.stringify(new Date());
          }
          console.log(
            'UPDATED RESPONSE - (Currently not being used as an entry to watermelon)',
            updatedResponse.data
          );
          watermelonController.isManuallyUpdating = false;
          return await this.localRepository.upsert(item);
        } else {
          console.log(
            'Nothing in response from the backend to upsert locally, proceeding to use local modified item:',
            item
          );
          const upsertResponse = await this.localRepository.upsert(item);

          watermelonController.isManuallyUpdating = false;
          return upsertResponse;
        }
      } catch (err) {
        watermelonController.isManuallyUpdating = false;
        console.warn('[BaseService] Upsert failed. Reason: ', err);
      }
    } else {
      // Offline: upsert locally
      watermelonController.isManuallyUpdating = false;
      return await this.localRepository.upsert(item);
    }
  }

  async getAll(
    parentId: string | null = null,
    endpointType: string | null = null,
    forceFetchFromLocal: boolean | null = null,
    page: number | null = null,
    allPages: boolean | null = null,
    sortBy: string | null = null,
    sortOrder: SortOrder | null = null,
    extraQueries: any[] | null = null,
    searchTerm: string | null = null
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
          parentId,
          searchTerm
        );

        if (Array.isArray(remoteResult)) {
          this.forcePaginateFromLocalNoAccessToBackendList = false;
          return remoteResult;
        } else {
          this.forcePaginateFromLocalNoAccessToBackendList = true;

          console.warn(
            '[BaseService] Remote sync failed. Will retry later. Proceeding with local retrieval'
          );

          const getAllResponse = await this.localRepository.getAll(
            sortBy,
            sortOrder,
            null,
            null,
            parentId,
            page,
            null,
            null,
            extraQueries
          );

          return getAllResponse.results;
        }
      } catch (err) {
        this.forcePaginateFromLocalNoAccessToBackendList = true;
        console.warn(
          '[BaseService] Remote sync failed. Will retry later. Proceeding with local retrieval. Reason: '
        );
        const getAllResponse = await this.localRepository.getAll(
          sortBy,
          sortOrder,
          null,
          null,
          parentId,
          page,
          null,
          null,
          extraQueries
        );
        return getAllResponse.results;
      }
    } else {
      this.forcePaginateFromLocalNoAccessToBackendList = true;
      const getAllResponse = await this.localRepository.getAll(
        sortBy,
        sortOrder,
        null,
        null,
        parentId,
        null,
        null,
        allPages,
        extraQueries
      );
      return getAllResponse.results;
    }
  }

  // NOTE: Currently used only by issue lists (reporter/assignee/resolved). Consider generalizing if reused.
  async getMore(
    endpointType: string | null,
    offlinePaginatedListRequest: OfflinePaginatedListRequestControls,
    offlinePagingInitialTrackingInfo?: OfflinePagingInitialTrackingInfo<T>,
    firstLocalPageRetry: boolean = false,
    extraQueries: any[] | null = null
  ): Promise<{ event: LocalGetAllEventInfo; results: T[] }> {
    try {
      console.log('FORCE TO OFFLINE PAGINATE: ', this.forcePaginateFromLocalNoAccessToBackendList);
      // Fetch From Remote
      if (!this.forcePaginateFromLocalNoAccessToBackendList) {
        const remoteResult = await this.remoteRepository.fetchMore(endpointType);
        if (Array.isArray(remoteResult)) {
          // Return event null indicating that a remote data fetch
          // was made
          return { event: null, results: remoteResult };
        } else {
          console.log('LOCAL PAGINATION');
          // Fetch From Local From Latest Value
          this.forcePaginateFromLocalNoAccessToBackendList = true;
          // Call Paging With Latest Value Removed To Query With Q.Lte
          const getAllResponse = await this.localRepository.getAll(
            'intake_date',
            'desc',
            offlinePaginatedListRequest.pageSize,
            null,
            null,
            offlinePaginatedListRequest.nextPage,
            offlinePagingInitialTrackingInfo,
            false,
            extraQueries
          );
          // return { result: getAllResponse, from: 'offline' };
          return getAllResponse;
        }
      } else {
        // Fetch From Local Regular Slice Paging, Except if offline current page equals 0
        this.forcePaginateFromLocalNoAccessToBackendList = true;
        const getAllResponse = await this.localRepository.getAll(
          'intake_date',
          'desc',
          offlinePaginatedListRequest.pageSize,
          null,
          null,
          offlinePaginatedListRequest.nextPage,
          firstLocalPageRetry || offlinePaginatedListRequest.prevPage === 0
            ? offlinePagingInitialTrackingInfo
            : undefined,
          false,
          extraQueries
        );
        return getAllResponse;
      }
    } catch (err) {
      if (!this.forcePaginateFromLocalNoAccessToBackendList) {
        this.forcePaginateFromLocalNoAccessToBackendList = true;
        console.error('Pagination from remote/local failed. Retrying...');
        try {
          const firstLocalPageRetry = true;
          const response = await this.getMore(
            endpointType,
            offlinePaginatedListRequest,
            offlinePagingInitialTrackingInfo,
            firstLocalPageRetry
          );
          return response;
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

    // 1. FETCH NEWLY CREATED RECORDS

    const nullSortBy = null;
    const nullSortOrder = null;
    const nullPage = null;
    const nullLimit = null;
    const nullUpdatedDate = null;
    const nullCreatedDate = null;
    const nullDeletedDate = null;
    const nullParentId = null;

    if (parentChanges) {
      // Parent IDs available - Pulling sub-items
      if (__DEV__) { 
        console.log(`${tableName}: Parent IDs object available (Might be empty) - pulling sub items`);
      }

      try {
        let newRecords = [];
        let updatedRecords = [];
        for (const parent of parentChanges.created) {
          newRecords = [
            ...newRecords,
            [
              await this.remoteRepository.fetchAll(
                endPointType,
                nullSortBy,
                nullSortOrder,
                nullPage,
                nullLimit,
                forceFetchAllPages,
                lastPulledAt, // created_date
                nullUpdatedDate,
                nullDeletedDate,
                parent.id ?? null,
                null
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
                nullSortBy,
                nullSortOrder,
                nullPage,
                nullLimit,
                forceFetchAllPages,
                nullCreatedDate,
                lastPulledAt,
                nullDeletedDate,
                parent.id ?? null,
                null
              ),
              parent.id ?? null,
            ],
          ];
        }

        const updatedFormattedRecords = updatedRecords.map((item) => {
          const parentId = item[1];
          const subItemsList = item[0];
          if (!subItemsList) return [];
          let formattedSubItems = [];
          for (let index = 0; index < subItemsList.length; index++) {
            const element = subItemsList[index];
            formattedSubItems.push(this.localRepository.fromRemoteToLocal(element, parentId));
          }

          return formattedSubItems;
        });

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
      if (__DEV__) { 
        console.log(`${tableName}: No Parent IDs, therefore no sub items to sync. This indicates a top level element pull event`);
      }

      try {
        const newRecords = await this.remoteRepository.fetchAll(
          endPointType,
          nullSortBy,
          nullSortOrder,
          nullPage,
          nullLimit,
          forceFetchAllPages,
          lastPulledAt,
          nullUpdatedDate,
          nullDeletedDate,
          nullParentId,
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
        tableChanges.updated = [];
        syncPullFailed = true;
      }

      // 2. FETCH UPDATED RECORDS
      if (lastPulledAt != null) {
        try {
          const updatedRecords = await this.remoteRepository.fetchAll(
            endPointType,
            nullSortBy,
            nullSortOrder,
            nullPage,
            nullLimit,
            forceFetchAllPages,
            nullCreatedDate,
            lastPulledAt,
            nullDeletedDate,
            nullParentId,
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

    // clean the array from null or undefined values that can cause problems during the push process
    tableChanges.created = tableChanges.created.filter((item) => item != null);
    tableChanges.updated = tableChanges.updated.filter((item) => item != null);
    tableChanges.deleted = tableChanges.deleted.filter((item) => item != null);

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
            throw new Error('Error CREATING element at remote while syncing');
          }

          console.log('CREATED', tableChanges.created);

          // Register the new local and server ids to be replaced on the next pull
          this.createdRecordsPostPushedWithNewBackendIDs = [
            ...this.createdRecordsPostPushedWithNewBackendIDs,
            [createdResponse, record.id],
          ];
        } catch (error) {
          throw new Error('Error CREATING element at remote while syncing. Reason: ', error);
        }
      }
    }

    // Handle updated records
    if (tableChanges.updated.length > 0) {
      console.log(`Pushing ${tableChanges.updated.length} updated records to ${tableName}`);
      for (const record of tableChanges.updated) {
        console.log('UPDATED', tableChanges.updated);
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
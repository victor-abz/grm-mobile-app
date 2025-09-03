import NetInfo from '@react-native-community/netinfo';
import { BaseLocalRepository } from "../../repositories/shared/BaseLocalRepository";
import { BaseRemoteRepository } from "../../repositories/shared/BaseRemoteRepository";
import { Model } from "@nozbe/watermelondb";


export class BaseService<T> {
  constructor(
    private localRepository: BaseLocalRepository<T>,
    private remoteRepository: BaseRemoteRepository<T>
  ) { }

  async upsert(item: Model): Promise<void> {
    await this.localRepository.upsert(item);

    const state = await NetInfo.fetch();
    if (state.isConnected) {
      try {
        const modelInterface = this.localRepository.fromLocalToRemote(item);
        await this.remoteRepository.create(modelInterface);
        // @ts-ignore
        item.syncAt = new Date();
        await this.localRepository.upsert(item);
      } catch (err) {
        console.warn('[BaseService] Remote sync failed. Will retry later.', err);
      }
    }
  }

  async getAll(parentId: string | null): Promise<T[]> {
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      try {
        return await this.remoteRepository.fetchAll(null, null, null, null, null, null, parentId);
      } catch (err) {
        console.warn('[BaseService] Remote sync failed. Will retry later.', err);
        console.log('[BaseService] Remote sync failed. Will retry later.', err);
        return await this.localRepository.getAll(null, null, null, null, parentId);
      }
    } else {
      return await this.localRepository.getAll(null, null, null, null, parentId);
    }
  }

  async pullChanges({ tableName, lastPulledAt }): Promise<{
    changes: { [key: string]: { deleted: any[]; created: any[]; updated: any[] } },
    timestamp: number
  }> {
    let changes = {};
    changes[tableName] = { created: [], updated: [], deleted: [] };

    const timestamp = Date.now();
    const tableChanges = changes[tableName];
    // 1. Fetch newly created records
    const newRecords = await this.remoteRepository.fetchAll(null, null, null, lastPulledAt, null, null, null);
    // @ts-ignore
    tableChanges.created = newRecords.map(record => ({ id: record.id, ...record }));

    // 2. Fetch updated records
    // const updatedRecords = await this.remoteRepository.fetchAll(null, null, null, null, lastPulledAt, null);
    // @ts-ignore
    // tableChanges.updated = updatedRecords.map(record => ({ id: record.id, ...record }));

    // 3. Fetch deleted records (soft deletes are highly recommended for this)
    // const deletedRecords = await this.remoteRepository.fetchAll(null, null, null, null, null, lastPulledAt);
    // @ts-ignore
    // tableChanges.deleted = deletedRecords.map(record => record.id);

    // Return all changes and the timestamp for the next pull
    return { changes, timestamp };
  }

  async pushChanges({ changes, lastPulledAt }): Promise<void> {
    const tableName = this.localRepository.tableName
    const tableChanges = changes[tableName];

    if (!tableChanges) {
      return
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

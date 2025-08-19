import NetInfo from '@react-native-community/netinfo';
import { BaseLocalRepository } from '../../repositories/local/BaseLocalRepository';
import { BaseRemoteRepository } from '../../repositories/remote/BaseRemoteRepository';

export class BaseService<T> {
  constructor(
    private localRepository: BaseLocalRepository<T>,
    private remoteRepository: BaseRemoteRepository<T>
  ) {}

  async createTable(): Promise<void> {
    await this.localRepository.createTable();
  }

  async insert(item: T): Promise<void> {
    await this.localRepository.upsert(item);

    const state = await NetInfo.fetch();
    if (state.isConnected) {
      try {
        const syncedItem = await this.remoteRepository.create(item);
        await this.localRepository.markSynced(syncedItem);
      } catch (err) {
        console.warn('[BaseService] Remote sync failed. Will retry later.', err);
      }
    }
  }

  async getAll(): Promise<T[]> {
    return this.localRepository.getAll();
  }

  async softDelete(id: string | number): Promise<void> {
    await this.localRepository.softDelete(id);
  }

  async sync(): Promise<void> {
    try {
      const unsyncedItems = await this.localRepository.getUnsynced();

      // Update direction ["push"]: Local -> Remote
      for (const item of unsyncedItems) {
        const row = item as any;

        try {
          if (row.deleted_at) {
            await this.remoteRepository.delete(row.id);
            await this.localRepository.hardDelete(row.id);
          } else {
            const syncedItem = await this.remoteRepository.create(item);
            await this.localRepository.markSynced(syncedItem);
          }
        } catch (err) {
          console.warn('[BaseService] Sync failed for item', item, err);
        }
      }

      // Update direction ["pull"]: Remote -> local
      // TODO: define merge priorities
      const results = await this.remoteRepository.fetchAll();
      for (let index = 0; index < results.length; index++) {
        const element = results[index];
        await this.localRepository.upsert(element);
      }

    } catch (error) {
      console.warn("Sync failed: ", error)
    }
  }
}
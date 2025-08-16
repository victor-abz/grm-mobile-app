
export class SyncService {
  constructor(
    private syncables: {
      sync(): Promise<void>;
    }[] = []
  ) {}

  register(syncable: { sync(): Promise<void> }) {
    this.syncables.push(syncable);
  }

  async syncAll(): Promise<void> {
    for (const syncable of this.syncables) {
      try {
        await syncable.sync();
      } catch (err) {
        console.warn('[SyncService] Failed to sync a repository', err);
      }
    }
  }
}

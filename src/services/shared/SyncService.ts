export class SyncService {
  constructor(
    // private issueLocal = new IssueLocalRepository(),
    // private issueRemote = new IssueRemoteRepository(),
  ) {}

  async syncAll(): Promise<void> {
    // await this.syncRepo(this.issueLocal, this.issueRemote);
  }

  private async syncRepo<T>(
    localRepo: { getUnsynced(): Promise<T[]>; markSynced(item: T): Promise<void> },
    remoteRepo: { create(item: T): Promise<T> }
  ) {
    const unsynced = await localRepo.getUnsynced();
    for (const item of unsynced) {
      try {
        const synced = await remoteRepo.create(item);
        await localRepo.markSynced(synced);
      } catch (err) {
        console.warn('Sync failed for item', item, err);
      }
    }
  }
}

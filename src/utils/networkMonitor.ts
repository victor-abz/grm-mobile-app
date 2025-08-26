import NetInfo, { NetInfoSubscription } from '@react-native-community/netinfo';
import { syncServiceInstance } from "../services/shared/SyncService";
import { issueStatusSyncable } from "../services/issues/IssueStatusService";
import { issueSyncable } from "../services/issues/IssueService";

let stableConnectionTimer: NodeJS.Timeout | null = null;
let initialSyncListener: NetInfoSubscription | null = null;
let watcherListener: NetInfoSubscription | null = null;
const stableConnectionTimmer = 15 * 60 * 1000;

export function registerServices(): void {
  syncServiceInstance.removeAll();
  // @ts-ignore
  syncServiceInstance.register(issueStatusSyncable);
  // @ts-ignore
  syncServiceInstance.register(issueSyncable);
}

async function setupConnectionWatcher(): Promise<void> {
  console.log('[Sync] Starting sync watcherListener');
  if (watcherListener) return;
  console.log('[Sync] No sync watcherListener initialized');
  watcherListener = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      if (stableConnectionTimer !== null) return;
      console.log('[Sync] Starting stable connection timer.');
      stableConnectionTimer = setTimeout(async () => {
        console.log('[Sync] Triggering sync after stable connection.');
        await syncServiceInstance.syncAll();
      }, stableConnectionTimmer);

    } else {
      if (stableConnectionTimer !== null) {
        console.log('[Sync] Connection lost, cancelling stable connection timer.');
      }
    }
  });
}

export async function initialSync(): Promise<void> {
  registerServices();

  await syncServiceInstance.initDB();
  initialSyncListener = NetInfo.addEventListener(async (state) => {
    if (state.isConnected) {
      await setupConnectionWatcher();
    }
  });
}
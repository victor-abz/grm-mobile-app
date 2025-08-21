import NetInfo, { NetInfoSubscription } from '@react-native-community/netinfo';
import { issueCategoryService } from '../services/shared/IssueCategoryService';
import { syncServiceInstance } from "../services/shared/SyncService";

let stableConnectionTimer: NodeJS.Timeout | null = null;
let initialSyncListener: NetInfoSubscription | null = null;
let watcherListener: NetInfoSubscription | null = null;
const stableConnectionTimmer = 15 * 60 * 1000;

export function registerServices(): void {
  syncServiceInstance.removeAll();
  syncServiceInstance.register(issueCategoryService)
}

function setupConnectionWatcher(): void {
  if (watcherListener) return;

  watcherListener = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      if (stableConnectionTimer !== null) return;

      console.log('[Sync] Starting stable connection timer.');
      stableConnectionTimer = setTimeout(() => {
        console.log('[Sync] Triggering sync after stable connection.');
        syncServiceInstance.syncAll();
        clearTimeout(stableConnectionTimer!);
        stableConnectionTimer = null;
      }, stableConnectionTimmer);

    } else {
      if (stableConnectionTimer !== null) {
        console.log('[Sync] Connection lost, cancelling stable connection timer.');
        clearTimeout(stableConnectionTimer);
        stableConnectionTimer = null;
      }
    }
  });
}

export async function initialSync(): Promise<void> {
  // Register services here ...
  //
  
  await syncServiceInstance.initDB();
  if (initialSyncListener) return;

  initialSyncListener = NetInfo.addEventListener(async (state) => {
    if (state.isConnected) {
      console.log('[Sync] Performing initial sync on first connection.');
      await syncServiceInstance.syncAll();

      if (initialSyncListener) {
        initialSyncListener();
        initialSyncListener = null;
      }

      setupConnectionWatcher();
    }
  });
}
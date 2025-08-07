import NetInfo from '@react-native-community/netinfo';
import { SyncService } from "../services/shared/SyncService";

let stableConnectionStart: number | null = null;
const syncService = new SyncService();

export function setupConnectionWatcher(): void {
  NetInfo.addEventListener(async (state) => {
    if (state.isConnected) {
      if (stableConnectionStart === null) {
        stableConnectionStart = Date.now();
      } else {
        const now = Date.now();
        const duration = now - stableConnectionStart;
        const fifteenMinutes = 15 * 60 * 1000;

        if (duration >= fifteenMinutes) {
          console.log('[Sync] Triggering sync after stable connection');
          await syncService.syncAll();
          stableConnectionStart = null;
        }
      }
    } else {
      stableConnectionStart = null;
    }
  });
}

import NetInfo, { NetInfoSubscription } from '@react-native-community/netinfo';
import { issueCategorySyncable } from '../services/issues/IssueCategoryService';
import { syncServiceInstance } from "../services/shared/SyncService";
import { issueStatusSyncable } from "../services/issues/IssueStatusService";
import { assigneeIssueListSyncable, reporterIssueListSyncable } from "../services/issues/IssueService";
import { issueTypeSyncable } from '../services/issues/IssueTypeService';
import { issueAgeGroupListSyncable } from '../services/issues/IssueAgeGroupService';
import { issueSubComponentSyncable } from '../services/issues/IssueSubComponentService';

let stableConnectionTimer: NodeJS.Timeout | null = null;
let initialSyncListener: NetInfoSubscription | null = null;
let watcherListener: NetInfoSubscription | null = null;
const stableConnectionTimmer = 15 * 60 * 1000;

export function registerServices(): void {
  syncServiceInstance.removeAll();
  syncServiceInstance.register(issueStatusSyncable);
  syncServiceInstance.register(issueCategorySyncable);
  syncServiceInstance.register(issueTypeSyncable);
  syncServiceInstance.register(assigneeIssueListSyncable);
  syncServiceInstance.register(reporterIssueListSyncable);
  syncServiceInstance.register(issueAgeGroupListSyncable);
  syncServiceInstance.register(issueSubComponentSyncable);
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

import { DirtyRaw, Model } from '@nozbe/watermelondb';
import { SyncStatus } from '@nozbe/watermelondb/Model';
import type { CreatedResponseWithBackendId, WatermelonId } from './BaseService';

export type Syncable = {
  replaceParentIds?(
    idsToReplace: [CreatedResponseWithBackendId, WatermelonId][],
    status?: SyncStatus
  ): Promise<Model[]>;
  pullChanges({
    tableName, lastPulledAt, parentChanges: [],
  }: {
    tableName: string;
    lastPulledAt: any;
    parentChanges?: { created: DirtyRaw[]; updated: DirtyRaw[]; deleted: string[]; };
  }): Promise<{
    changes: {
      issue: { tableName: { deleted: any[]; created: any[]; updated: any[]; }; };
      tableName: { deleted: any[]; created: any[]; updated: any[]; };
    };
    timestamp: number;
    createdRecordsPostPushedWithNewBackendIDs: [CreatedResponseWithBackendId, WatermelonId][];
  }>;
  pushChanges({ changes, lastPulledAt }): Promise<void>;
  tableName: string;
  fetchAllParents?(tableName: string): Promise<Model[]>;
};

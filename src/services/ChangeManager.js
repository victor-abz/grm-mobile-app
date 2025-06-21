import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuid } from 'uuid';

export const STORAGE_KEYS = {
  CHANGES: 'grm_changes',
  DOCUMENTS: 'grm_documents',
  SYNC_STATE: 'grm_sync_state',
};

export const CHANGE_STATUS = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  COMPLETED: 'completed',
  ERROR: 'error',
};

export class ChangeManager {
  constructor() {
    this.changes = new Map();
    this.initialized = false;
  }

  async initialize() {
    try {
      if (this.initialized) {
        return;
      }

      // Load pending changes from storage
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CHANGES);
      if (stored) {
        const changes = JSON.parse(stored);
        changes.forEach((change) => this.changes.set(change.id, change));
      }

      this.initialized = true;
      console.log('ChangeManager initialized with', this.changes.size, 'changes');
    } catch (error) {
      console.error('Error initializing ChangeManager:', error);
      throw error;
    }
  }

  async addChange(type, action, data) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const change = {
        id: uuid(),
        type,
        action,
        status: CHANGE_STATUS.PENDING,
        timestamp: new Date().toISOString(),
        retryCount: 0,
        data: {
          docId: data.docId,
          isLocal: data.isLocal,
          changes: data.changes,
          parentId: data.parentId,
        },
      };

      this.changes.set(change.id, change);
      await this.persistChanges();

      console.log('Added change:', { type, action, docId: data.docId });
      return change.id;
    } catch (error) {
      console.error('Error adding change:', error);
      throw error;
    }
  }

  async markChangeStatus(changeId, status) {
    try {
      const change = this.changes.get(changeId);
      if (change) {
        change.status = status;
        if (status === CHANGE_STATUS.SYNCING) {
          change.retryCount++;
        }
        await this.persistChanges();
        console.log('Marked change', changeId, 'as', status);
      }
    } catch (error) {
      console.error('Error marking change status:', error);
      throw error;
    }
  }

  async markChangeComplete(changeId) {
    await this.markChangeStatus(changeId, CHANGE_STATUS.COMPLETED);
  }

  async markChangeSyncing(changeId) {
    await this.markChangeStatus(changeId, CHANGE_STATUS.SYNCING);
  }

  async markChangeError(changeId, error) {
    const change = this.changes.get(changeId);
    if (change) {
      change.status = CHANGE_STATUS.ERROR;
      change.error = error.message || String(error);
      await this.persistChanges();
      console.log('Marked change', changeId, 'as error:', error);
    }
  }

  async persistChanges() {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.CHANGES,
        JSON.stringify(Array.from(this.changes.values()))
      );
    } catch (error) {
      console.error('Error persisting changes:', error);
      throw error;
    }
  }

  async getPendingChanges() {
    return Array.from(this.changes.values())
      .filter((change) => change.status === CHANGE_STATUS.PENDING)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  async getChangesByDocId(docId) {
    return Array.from(this.changes.values())
      .filter((change) => change.data.docId === docId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  async cleanupCompletedChanges(olderThan = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThan);

    const completedChanges = Array.from(this.changes.values()).filter(
      (change) =>
        change.status === CHANGE_STATUS.COMPLETED && new Date(change.timestamp) < cutoffDate
    );

    for (const change of completedChanges) {
      this.changes.delete(change.id);
    }

    if (completedChanges.length > 0) {
      await this.persistChanges();
      console.log('Cleaned up', completedChanges.length, 'completed changes');
    }
  }

  async reset() {
    this.changes.clear();
    await AsyncStorage.removeItem(STORAGE_KEYS.CHANGES);
    console.log('ChangeManager reset');
  }
}

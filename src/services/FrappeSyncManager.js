import AsyncStorage from '@react-native-async-storage/async-storage';
import { FrappeApp } from 'frappe-js-sdk';
import { LocalDatabase, LocalGRMDatabase } from '../utils/databaseManager';
import { FRAPPE_BASE_URL } from '../utils/constants';
import { ChangeManager, STORAGE_KEYS, CHANGE_STATUS } from './ChangeManager';

const SYNC_KEYS = {
  LAST_SYNC_TIMESTAMP: 'last_sync_timestamp',
  PENDING_CHANGES: 'pending_changes',
  SYNC_STATUS: 'sync_status',
  USER_DATA_SYNCED: 'user_data_synced',
  ...STORAGE_KEYS,
};

const SYNC_STATUS = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  ERROR: 'error',
  SUCCESS: 'success',
};

/**
 * Helper function to extract data from Frappe API response format
 * Handles the nested structure: { response: { message: { status, data } } }
 */
function extractApiResponse(response) {
  // Handle the nested Frappe response format
  if (response?.response?.message) {
    const { message } = response.response;
    return {
      status: message.status,
      data: message.data,
      message: message.message || (message.status === 'success' ? 'Success' : 'Error'),
    };
  }

  // Handle direct response format (backward compatibility)
  if (response?.status) {
    return {
      status: response.status,
      data: response.data,
      message: response.message || (response.status === 'success' ? 'Success' : 'Error'),
    };
  }

  // Handle raw data response
  if (response && !response.status && !response.response) {
    return {
      status: 'success',
      data: response,
      message: 'Success',
    };
  }

  // Default error response
  return {
    status: 'error',
    data: null,
    message: 'Invalid response format',
  };
}

class FrappeSyncManager {
  constructor() {
    this.isOnline = true;
    this.syncInProgress = false;
    this.pendingChanges = [];
    this.syncListeners = [];
    this.lastSyncTimestamp = null;
    this.frappeApp = null;
    this.credentials = null;
    this.changeManager = new ChangeManager();
    this.userContext = null;
  }

  async initialize(credentials = null) {
    try {
      if (credentials) {
        this.credentials = credentials;
        this.frappeApp = new FrappeApp(FRAPPE_BASE_URL);
        await this.frappeApp.auth().loginWithUsernamePassword(credentials);
      }

      // Initialize change manager
      await this.changeManager.initialize();

      // Migrate existing pending changes if any
      const pendingChanges = await AsyncStorage.getItem(SYNC_KEYS.PENDING_CHANGES);
      if (pendingChanges) {
        const changes = JSON.parse(pendingChanges);
        await this.migratePendingChanges(changes);
      }

      // Load last sync timestamp
      const lastSync = await AsyncStorage.getItem(SYNC_KEYS.LAST_SYNC_TIMESTAMP);
      this.lastSyncTimestamp = lastSync ? new Date(lastSync) : null;

      console.log('FrappeSyncManager initialized', {
        lastSync: this.lastSyncTimestamp,
        pendingChanges: this.pendingChanges.length,
      });
    } catch (error) {
      console.error('Error initializing FrappeSyncManager:', error);
    }
  }

  async migratePendingChanges(oldChanges) {
    try {
      for (const change of oldChanges) {
        await this.changeManager.addChange(change.type, change.action, {
          docId: change.local_id || change.id,
          isLocal: !!change.local_id,
          changes: change.data,
        });
      }
      // Clear old pending changes
      await AsyncStorage.removeItem(SYNC_KEYS.PENDING_CHANGES);
      this.pendingChanges = [];
    } catch (error) {
      console.error('Error migrating pending changes:', error);
    }
  }

  async createIssue(issueData) {
    try {
      console.log('Creating issue with data:', issueData);

      // Get user assignment for the region
      const regionAssignment = this.userContext?.assignments?.find(
        (a) => a.region.id === issueData.administrative_region
      );

      // If we have a matching assignment and category, set the assignee
      if (regionAssignment && issueData.category) {
        const categoryDoc = await LocalDatabase.get(issueData.category);
        if (categoryDoc.assigned_department === regionAssignment.department.id) {
          issueData.assignee = this.userContext.user.id;
        }
      }

      // If online, try direct API creation first
      if (this.isOnline && this.credentials) {
        try {
          const call = this.getCall();
          const rawResponse = await call.post('egrm.api.issue.create', {
            issue_data: issueData,
          });
          const response = extractApiResponse(rawResponse);

          if (response.status === 'success' && response.data?.name) {
            // Store in local database with server ID
            const localIssue = {
              _id: response.data.name,
              name: response.data.name,
              ...issueData,
              ...response.data,
              isLocal: false,
              serverSynced: true,
              lastSyncedAt: new Date().toISOString(),
              created_date: response.data.creation || new Date().toISOString(),
              modified_date: response.data.modified || new Date().toISOString(),
            };

            await LocalGRMDatabase.put(localIssue);
            return { status: 'success', data: localIssue };
          }
        } catch (error) {
          console.log('Online creation failed, falling back to offline:', error.message);
        }
      }

      // Offline or online creation failed - store locally and queue for sync
      const localId = this.generateLocalId();
      const localIssue = {
        _id: localId,
        ...issueData,
        isLocal: true,
        serverSynced: false,
        created_date: new Date().toISOString(),
        modified_date: new Date().toISOString(),
      };

      await LocalGRMDatabase.put(localIssue);

      // Add to change queue
      await this.changeManager.addChange('issue', 'create', {
        docId: localId,
        isLocal: true,
        changes: issueData,
      });

      return { status: 'pending', data: localIssue };
    } catch (error) {
      console.error('Error creating issue:', error);
      return { status: 'error', message: error.message };
    }
  }

  async updateIssue(issueId, updateData) {
    try {
      // Get current issue
      const currentIssue = await LocalGRMDatabase.get(issueId);

      // Update locally first
      const updatedIssue = {
        ...currentIssue,
        ...updateData,
        modified_date: new Date().toISOString(),
      };

      await LocalGRMDatabase.put(updatedIssue);

      // Add to change queue if not a local-only issue
      if (!currentIssue.isLocal) {
        await this.changeManager.addChange('issue', 'update', {
          docId: issueId,
          isLocal: false,
          changes: updateData,
        });
      }

      // If online and not a local issue, try to sync immediately
      if (this.isOnline && this.credentials && !currentIssue.isLocal) {
        try {
          const call = this.getCall();
          await call.post('egrm.api.issue.update', {
            issue_id: issueId,
            ...updateData,
          });
        } catch (error) {
          console.log('Server update failed, change queued for sync:', error.message);
        }
      }

      return updatedIssue;
    } catch (error) {
      console.error('Error updating issue:', error);
      throw error;
    }
  }

  async pushPendingChanges() {
    if (!this.isOnline || !this.credentials) {
      console.log('Cannot push changes while offline');
      return;
    }

    console.log('Pushing pending changes...');

    try {
      const pendingChanges = await this.changeManager.getPendingChanges();

      if (pendingChanges.length === 0) {
        console.log('No pending changes to push');
        return;
      }

      // Group changes by type
      const groupedChanges = {
        issues: [],
        attachments: [],
      };

      pendingChanges.forEach((change) => {
        if (groupedChanges[change.type]) {
          const changeData = {
            action: change.action,
            data: change.data.changes,
            local_id: change.data.isLocal ? change.data.docId : undefined,
            id: !change.data.isLocal ? change.data.docId : undefined,
          };
          groupedChanges[change.type].push(changeData);
        }
      });

      // Push to server
      const call = this.getCall();
      const rawResponse = await call.post('egrm.api.sync.push_changes', {
        changes_data: JSON.stringify(groupedChanges),
      });

      const response = extractApiResponse(rawResponse);

      if (response.status === 'success') {
        const results = response.data;

        // Update local IDs with server IDs
        if (results.created?.length > 0) {
          for (const item of results.created) {
            await this.updateLocalWithServerId(item.local_id, item.server_id);
            const changeId = await this.findChangeIdByLocalId(item.local_id);
            if (changeId) {
              await this.changeManager.markChangeComplete(changeId);
            }
          }
        }

        // Mark updated items as synced
        if (results.updated?.length > 0) {
          for (const item of results.updated) {
            await this.markDocumentSynced(item.id);
            const changeId = await this.findChangeIdByDocId(item.id);
            if (changeId) {
              await this.changeManager.markChangeComplete(changeId);
            }
          }
        }

        // Handle errors
        if (results.errors?.length > 0) {
          for (const error of results.errors) {
            const changeId =
              (await this.findChangeIdByLocalId(error.local_id)) ||
              (await this.findChangeIdByDocId(error.id));
            if (changeId) {
              await this.changeManager.markChangeError(changeId, new Error(error.error));
            }
          }
        }

        console.log('Push completed successfully');
      } else {
        throw new Error(response.message || 'Failed to push changes');
      }

      // Clean up old completed changes
      await this.changeManager.cleanupCompletedChanges();

      return response;
    } catch (error) {
      console.error('Error pushing changes:', error);
      throw error;
    }
  }

  async findChangeIdByLocalId(localId) {
    const changes = await this.changeManager.getChangesByDocId(localId);
    return changes.length > 0 ? changes[0].id : null;
  }

  async findChangeIdByDocId(docId) {
    const changes = await this.changeManager.getChangesByDocId(docId);
    return changes.length > 0 ? changes[0].id : null;
  }

  async updateLocalWithServerId(localId, serverId) {
    try {
      // Get local document
      const localDoc = await LocalGRMDatabase.get(localId);

      // Create new document with server ID
      const serverDoc = {
        ...localDoc,
        _id: serverId,
        isLocal: false,
        serverSynced: true,
        lastSyncedAt: new Date().toISOString(),
      };
      delete serverDoc._rev;

      // Remove local document and add server document
      await LocalGRMDatabase.remove(localDoc);
      await LocalGRMDatabase.put(serverDoc);

      console.log(`Updated local ID ${localId} to server ID ${serverId}`);
    } catch (error) {
      console.error(`Error updating local ID ${localId}:`, error);
      throw error;
    }
  }

  async markDocumentSynced(docId) {
    try {
      const doc = await LocalGRMDatabase.get(docId);
      const updatedDoc = {
        ...doc,
        serverSynced: true,
        lastSyncedAt: new Date().toISOString(),
      };
      await LocalGRMDatabase.put(updatedDoc);
    } catch (error) {
      console.error(`Error marking document ${docId} as synced:`, error);
    }
  }

  /**
   * Set credentials for API calls
   */
  async setCredentials(credentials) {
    this.credentials = credentials;
    if (credentials) {
      this.frappeApp = new FrappeApp(FRAPPE_BASE_URL);
      await this.frappeApp.auth().loginWithUsernamePassword(credentials);
    }
  }

  /**
   * Get Frappe call instance
   */
  getCall() {
    if (!this.frappeApp) {
      throw new Error('FrappeSyncManager not initialized with credentials');
    }
    return this.frappeApp.call();
  }

  /**
   * Add a sync listener
   */
  addSyncListener(listener) {
    this.syncListeners.push(listener);
  }

  /**
   * Remove a sync listener
   */
  removeSyncListener(listener) {
    this.syncListeners = this.syncListeners.filter((l) => l !== listener);
  }

  /**
   * Notify sync listeners
   */
  notifySyncListeners(status, data = {}) {
    this.syncListeners.forEach((listener) => {
      try {
        listener(status, data);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  /**
   * Set online status
   */
  setOnlineStatus(isOnline) {
    const wasOffline = !this.isOnline;
    this.isOnline = isOnline;

    // If we just came online and have pending changes, sync
    if (isOnline && wasOffline && this.pendingChanges.length > 0) {
      this.performSync();
    }
  }

  /**
   * Perform full synchronization
   */
  async performSync(projectId = null) {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return;
    }

    if (!this.isOnline) {
      console.log('Cannot sync while offline');
      return;
    }

    this.syncInProgress = true;
    this.notifySyncListeners(SYNC_STATUS.SYNCING);

    try {
      console.log('Starting sync process...');

      // Step 1: Get latest user context
      await this.getUserContext();

      // Step 2: Push pending changes to server
      await this.pushPendingChanges();

      // Step 3: Pull changes from server
      await this.pullChangesFromServer(projectId);

      // Step 4: Update last sync timestamp
      this.lastSyncTimestamp = new Date();
      await AsyncStorage.setItem(
        SYNC_KEYS.LAST_SYNC_TIMESTAMP,
        this.lastSyncTimestamp.toISOString()
      );

      console.log('Sync completed successfully');
      this.notifySyncListeners(SYNC_STATUS.SUCCESS);
    } catch (error) {
      console.error('Sync failed:', error);
      this.notifySyncListeners(SYNC_STATUS.ERROR, { error: error.message });
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Pull changes from server
   */
  async pullChangesFromServer(projectId = null) {
    console.log('Pulling changes from server...');

    try {
      const call = this.getCall();

      const params = {};
      if (this.lastSyncTimestamp) {
        params.last_sync_timestamp = this.lastSyncTimestamp.toISOString();
      }
      if (projectId) {
        params.project_id = projectId;
      }

      const rawResponse = await call.get('egrm.api.sync.get_changes', params);
      const response = extractApiResponse(rawResponse);

      if (response.status === 'success') {
        const { changes } = response.data;

        // Apply changes to local database
        await this.applyChangesToLocal(changes);

        console.log('Pull completed successfully');
      } else {
        throw new Error(response.message || 'Failed to pull changes');
      }
    } catch (error) {
      console.error('Error pulling changes:', error);
      throw error;
    }
  }

  /**
   * Get initial user data (for first sync)
   */
  async getInitialUserData(projectId = null) {
    console.log('Getting initial user data...');

    try {
      const call = this.getCall();

      const params = {};
      if (projectId) {
        params.project_id = projectId;
      }

      const rawResponse = await call.get('egrm.api.sync.get_user_data', params);
      const response = extractApiResponse(rawResponse);

      if (response.status === 'success') {
        const { data } = response;

        // Clear local databases
        await this.clearLocalDatabases();

        // Apply initial data to local database
        await this.applyInitialDataToLocal(data);

        // Mark as synced
        await AsyncStorage.setItem(SYNC_KEYS.USER_DATA_SYNCED, 'true');

        console.log('Initial user data loaded successfully');
        return data;
      }
      throw new Error(response.message || 'Failed to get user data');
    } catch (error) {
      console.warn('⚠️ Could not get initial user data from server:', error.message || error);

      // Don't throw error - allow app to continue with offline/local data
      // Mark as attempted so we don't keep trying on every startup
      await AsyncStorage.setItem(SYNC_KEYS.USER_DATA_SYNCED, 'offline_mode');

      console.log('📱 Continuing in offline mode - app will use local/fallback data');
      return null;
    }
  }

  /**
   * Add a change to pending queue
   */
  async addPendingChange(change) {
    this.pendingChanges.push({
      ...change,
      timestamp: new Date().toISOString(),
      local_id: change.local_id || this.generateLocalId(),
    });

    await AsyncStorage.setItem(SYNC_KEYS.PENDING_CHANGES, JSON.stringify(this.pendingChanges));

    // If online, try to sync immediately
    if (this.isOnline && !this.syncInProgress) {
      setTimeout(() => this.performSync(), 1000); // Debounce
    }
  }

  /**
   * Upload attachment
   */
  async uploadAttachment(issueId, attachmentData) {
    try {
      // Store locally first
      const localAttachment = {
        _id: this.generateLocalId(),
        issue_id: issueId,
        ...attachmentData,
        _local: true,
        created_date: new Date().toISOString(),
      };

      await LocalGRMDatabase.put(localAttachment);

      // If online, try to upload to server
      if (this.isOnline && this.credentials) {
        try {
          const call = this.getCall();

          const rawResponse = await call.post('egrm.api.attachment.upload', {
            issue_id: issueId,
            file_data: attachmentData.file_data,
            filename: attachmentData.filename,
            content_type: attachmentData.content_type,
          });

          const response = extractApiResponse(rawResponse);

          if (response.status === 'success') {
            console.log('Attachment uploaded to server');
            return response.data;
          }
          // Server upload failed, add to pending changes
          await this.addPendingChange({
            action: 'upload',
            type: 'attachment',
            data: { issue_id: issueId, ...attachmentData },
            local_id: localAttachment._id,
          });
        } catch (error) {
          console.log('Server upload failed, adding to pending changes:', error.message);
          await this.addPendingChange({
            action: 'upload',
            type: 'attachment',
            data: { issue_id: issueId, ...attachmentData },
            local_id: localAttachment._id,
          });
        }
      } else {
        // Offline - add to pending changes
        await this.addPendingChange({
          action: 'upload',
          type: 'attachment',
          data: { issue_id: issueId, ...attachmentData },
          local_id: localAttachment._id,
        });
      }

      return localAttachment;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      throw error;
    }
  }

  /**
   * Apply changes to local database
   */
  async applyChangesToLocal(changes) {
    console.log('Applying changes to local database...');

    // Apply issues
    if (changes.issues && changes.issues.length > 0) {
      for (const issue of changes.issues) {
        await this.upsertLocalDocument(LocalGRMDatabase, this.convertIssueFromServer(issue));
      }
    }

    // Apply regions
    if (changes.regions && changes.regions.length > 0) {
      for (const region of changes.regions) {
        await this.upsertLocalDocument(LocalDatabase, this.convertRegionFromServer(region));
      }
    }

    // Apply categories
    if (changes.categories && changes.categories.length > 0) {
      for (const category of changes.categories) {
        await this.upsertLocalDocument(LocalDatabase, this.convertCategoryFromServer(category));
      }
    }

    // Apply other lookup data
    await this.applyLookupChanges(changes);
  }

  /**
   * Apply initial data to local database
   */
  async applyInitialDataToLocal(data) {
    console.log('Applying initial data to local database...');

    // Apply all data types
    const dataTypes = [
      'projects',
      'regions',
      'categories',
      'types',
      'statuses',
      'age_groups',
      'citizen_groups',
      'departments',
      'issues',
    ];

    for (const dataType of dataTypes) {
      if (data[dataType]) {
        await this.applyDataTypeToLocal(dataType, data[dataType]);
      }
    }
  }

  /**
   * Apply specific data type to local database
   */
  async applyDataTypeToLocal(dataType, items) {
    if (!Array.isArray(items)) {
      // Handle nested objects like citizen_groups
      if (typeof items === 'object') {
        for (const [key, value] of Object.entries(items)) {
          if (Array.isArray(value)) {
            for (const item of value) {
              await this.upsertLocalDocument(LocalDatabase, this.convertFromServer(item, key));
            }
          }
        }
      }
      return;
    }

    for (const item of items) {
      const convertedItem = this.convertFromServer(item, dataType);
      const database = dataType === 'issues' ? LocalGRMDatabase : LocalDatabase;
      await this.upsertLocalDocument(database, convertedItem);
    }
  }

  /**
   * Convert server data to local format
   */
  convertFromServer(item, type) {
    const baseItem = {
      _id: item.name || item.id,
      type: type.slice(0, -1), // Remove 's' from plural
      ...item,
    };

    // Type-specific conversions
    switch (type) {
      case 'issues':
        return this.convertIssueFromServer(item);
      case 'regions':
        return this.convertRegionFromServer(item);
      case 'categories':
        return this.convertCategoryFromServer(item);
      default:
        return baseItem;
    }
  }

  /**
   * Convert issue from server format to local format
   */
  convertIssueFromServer(serverIssue) {
    return {
      _id: serverIssue.name,
      type: 'issue',
      internal_code: serverIssue.internal_code,
      tracking_code: serverIssue.tracking_code,
      auto_increment_id: serverIssue.auto_increment_id,
      description: serverIssue.description,
      attachments: serverIssue.attachments || [],
      status: {
        id: serverIssue.status,
        name: serverIssue.status_details?.name || '',
      },
      logs: serverIssue.logs || [],
      ongoing_issue: serverIssue.ongoing_issue,
      assignee: serverIssue.assignee
        ? {
            id: serverIssue.assignee,
            name: serverIssue.assignee_name || '',
          }
        : null,
      reporter: serverIssue.reporter
        ? {
            id: serverIssue.reporter,
            name: serverIssue.reporter_name || '',
          }
        : null,
      citizen: serverIssue.citizen_name,
      citizen_type: serverIssue.citizen_type,
      citizen_age_group: serverIssue.citizen_age_group
        ? {
            id: serverIssue.citizen_age_group,
            name: serverIssue.citizen_age_group_name || '',
          }
        : null,
      gender: serverIssue.gender,
      citizen_group_1: serverIssue.citizen_group_1,
      citizen_group_2: serverIssue.citizen_group_2,
      contact_medium: serverIssue.contact_medium,
      category: {
        id: serverIssue.category,
        name: serverIssue.category_details?.name || '',
        confidentiality_level: serverIssue.category_details?.confidentiality_level || '',
      },
      issue_type: {
        id: serverIssue.issue_type,
        name: serverIssue.type_details?.name || '',
      },
      created_date: serverIssue.creation || serverIssue.created_date,
      resolution_days: serverIssue.resolution_days,
      resolution_date: serverIssue.resolution_date,
      intake_date: serverIssue.intake_date,
      issue_date: serverIssue.issue_date,
      comments: serverIssue.comments || [],
      contact_information: {
        type: serverIssue.contact_type,
        contact: serverIssue.contact_value,
      },
      administrative_region: {
        administrative_id: serverIssue.administrative_region,
        name: serverIssue.region_details?.name || '',
        latitude: serverIssue.region_details?.latitude,
        longitude: serverIssue.region_details?.longitude,
      },
      confirmed: serverIssue.confirmed,
      research_result: serverIssue.research_result,
      resolution_accepted: serverIssue.resolution_accepted,
      rating: serverIssue.rating,
      escalate_flag: serverIssue.escalate_flag,
      escalation_reasons: serverIssue.escalation_reasons || [],
      reject_reason: serverIssue.reject_reason,
    };
  }

  /**
   * Convert region from server format to local format
   */
  convertRegionFromServer(serverRegion) {
    return {
      _id: serverRegion.name,
      type: 'administrative_level',
      administrative_id: serverRegion.name,
      name: serverRegion.region_name,
      administrative_level: serverRegion.administrative_level,
      parent_id: serverRegion.parent_region,
      latitude: serverRegion.latitude,
      longitude: serverRegion.longitude,
      project: serverRegion.project,
    };
  }

  /**
   * Convert category from server format to local format
   */
  convertCategoryFromServer(serverCategory) {
    return {
      _id: serverCategory.name,
      type: 'issue_category',
      id: serverCategory.name,
      name: serverCategory.category_name,
      label: serverCategory.category_name,
      abbreviation: serverCategory.abbreviation,
      value: serverCategory.name,
      assigned_department: serverCategory.assigned_department,
      assigned_appeal_department: serverCategory.assigned_appeal_department,
      assigned_escalation_department: serverCategory.assigned_escalation_department,
      confidentiality_level: serverCategory.confidentiality_level,
      redirection_protocol: serverCategory.redirection_protocol,
      project: serverCategory.project,
    };
  }

  /**
   * Upsert document to local database
   */
  async upsertLocalDocument(database, doc) {
    try {
      // Try to get existing document
      const existing = await database.get(doc._id);
      doc._rev = existing._rev;
    } catch (error) {
      // Document doesn't exist, that's fine
    }

    await database.put(doc);
  }

  /**
   * Apply lookup changes to local database
   */
  async applyLookupChanges(changes) {
    const lookupTypes = ['statuses', 'age_groups', 'citizen_groups', 'departments', 'types'];

    for (const lookupType of lookupTypes) {
      if (changes[lookupType]) {
        await this.applyDataTypeToLocal(lookupType, changes[lookupType]);
      }
    }
  }

  /**
   * Clear local databases
   */
  async clearLocalDatabases() {
    try {
      // Get all documents and delete them
      const grmDocs = await LocalGRMDatabase.allDocs({ include_docs: true });
      const eadlDocs = await LocalDatabase.allDocs({ include_docs: true });

      // Delete GRM documents
      for (const row of grmDocs.rows) {
        await LocalGRMDatabase.remove(row.doc);
      }

      // Delete EADL documents
      for (const row of eadlDocs.rows) {
        await LocalDatabase.remove(row.doc);
      }

      console.log('Local databases cleared');
    } catch (error) {
      console.error('Error clearing local databases:', error);
    }
  }

  /**
   * Generate a local ID
   */
  generateLocalId() {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if user data has been synced
   */
  async hasUserDataBeenSynced() {
    const synced = await AsyncStorage.getItem(SYNC_KEYS.USER_DATA_SYNCED);
    // Consider both successful sync ('true') and offline mode ('offline_mode') as "synced"
    return synced === 'true' || synced === 'offline_mode';
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      pendingChanges: this.pendingChanges.length,
      lastSyncTimestamp: this.lastSyncTimestamp,
    };
  }

  /**
   * Force full resync
   */
  async forceFullResync(projectId = null) {
    // Clear sync state
    await AsyncStorage.removeItem(SYNC_KEYS.LAST_SYNC_TIMESTAMP);
    await AsyncStorage.removeItem(SYNC_KEYS.USER_DATA_SYNCED);
    this.lastSyncTimestamp = null;

    // Get fresh data
    await this.getInitialUserData(projectId);

    // Perform sync
    await this.performSync(projectId);
  }

  /**
   * Format citizen type to match server requirements
   */
  formatCitizenType(citizenType) {
    // Map of possible input values to correct server values
    const citizenTypeMap = {
      1: 'Visible',
      2: 'Confidential',
      3: 'On behalf of Individual',
      4: 'On behalf of Organization',
      visible: 'Visible',
      confidential: 'Confidential',
      on_behalf_individual: 'On behalf of Individual',
      on_behalf_organization: 'On behalf of Organization',
    };

    // If the input is already a valid type, return it
    const validTypes = [
      'Visible',
      'Confidential',
      'On behalf of Individual',
      'On behalf of Organization',
    ];
    if (validTypes.includes(citizenType)) {
      return citizenType;
    }

    // Try to map the input to a valid type
    const mappedType = citizenTypeMap[citizenType?.toLowerCase?.() || citizenType];
    if (mappedType) {
      return mappedType;
    }

    // Default to 'Visible' if no valid mapping found
    console.warn(`Invalid citizen type "${citizenType}" defaulting to "Visible"`);
    return 'Visible';
  }

  /**
   * Get user context from server
   */
  async getUserContext() {
    try {
      const call = this.getCall();
      const rawResponse = await call.get('egrm.api.lookup.get_user_context');
      const response = extractApiResponse(rawResponse);

      if (response.status === 'success') {
        this.userContext = response.data;
        return response.data;
      }
      throw new Error(response.message || 'Failed to get user context');
    } catch (error) {
      console.error('Error getting user context:', error);
      throw error;
    }
  }
}

// Create singleton instance
const frappeSyncManager = new FrappeSyncManager();

export default frappeSyncManager;

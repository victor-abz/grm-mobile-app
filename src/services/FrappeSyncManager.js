import AsyncStorage from '@react-native-async-storage/async-storage';
import { FrappeApp } from 'frappe-js-sdk';
import { LocalDatabase, LocalGRMDatabase } from '../utils/databaseManager';
import { FRAPPE_BASE_URL } from '../utils/constants';

const SYNC_KEYS = {
  LAST_SYNC_TIMESTAMP: 'last_sync_timestamp',
  PENDING_CHANGES: 'pending_changes',
  SYNC_STATUS: 'sync_status',
  USER_DATA_SYNCED: 'user_data_synced',
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
  }

  /**
   * Initialize the sync manager with credentials
   */
  async initialize(credentials = null) {
    try {
      if (credentials) {
        this.credentials = credentials;
        this.frappeApp = new FrappeApp(FRAPPE_BASE_URL);
        await this.frappeApp.auth().loginWithUsernamePassword(credentials);
      }

      // Load last sync timestamp
      const lastSync = await AsyncStorage.getItem(SYNC_KEYS.LAST_SYNC_TIMESTAMP);
      this.lastSyncTimestamp = lastSync ? new Date(lastSync) : null;

      // Load pending changes
      const pendingChanges = await AsyncStorage.getItem(SYNC_KEYS.PENDING_CHANGES);
      this.pendingChanges = pendingChanges ? JSON.parse(pendingChanges) : [];

      console.log('FrappeSyncManager initialized', {
        lastSync: this.lastSyncTimestamp,
        pendingChanges: this.pendingChanges.length,
      });
    } catch (error) {
      console.error('Error initializing FrappeSyncManager:', error);
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

      // Step 1: Push pending changes to server
      await this.pushPendingChanges();

      // Step 2: Pull changes from server
      await this.pullChangesFromServer(projectId);

      // Step 3: Update last sync timestamp
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
   * Push pending changes to server
   */
  async pushPendingChanges() {
    if (this.pendingChanges.length === 0) {
      console.log('No pending changes to push');
      return;
    }

    // Log the actual pending changes
    console.log(
      '[FrappeSyncManager] Pending changes before sync:',
      JSON.stringify(this.pendingChanges, null, 2)
    );

    // Validate and clean up malformed entries
    let validChanges = [];
    let removedCount = 0;
    for (const change of this.pendingChanges) {
      if (!change.type || !change.action || !change.data) {
        console.warn('[FrappeSyncManager] Removing malformed pending change:', change);
        removedCount++;
        continue;
      }
      validChanges.push(change);
    }
    if (removedCount > 0) {
      this.pendingChanges = validChanges;
      await AsyncStorage.setItem(SYNC_KEYS.PENDING_CHANGES, JSON.stringify(this.pendingChanges));
      console.log(`[FrappeSyncManager] Removed ${removedCount} malformed pending changes.`);
    }

    if (this.pendingChanges.length === 0) {
      console.log('No valid pending changes to push after cleanup');
      return;
    }

    console.log(`[FrappeSyncManager] Valid pending changes to sync: ${this.pendingChanges.length}`);

    // Log each pending change
    this.pendingChanges.forEach((change, idx) => {
      console.log(`[FrappeSyncManager] Change #${idx + 1}:`, JSON.stringify(change, null, 2));
    });

    try {
      const call = this.getCall();

      // Group changes by type for better organization
      const groupedChanges = {
        issues: this.pendingChanges.filter((change) => change.type === 'issue'),
        attachments: this.pendingChanges.filter((change) => change.type === 'attachment'),
      };

      console.log(
        '[FrappeSyncManager] Grouped changes for sync:',
        JSON.stringify(groupedChanges, null, 2)
      );
      console.log('[FrappeSyncManager] Sync API endpoint: egrm.api.sync.push_changes');
      console.log(
        '[FrappeSyncManager] Sync API payload:',
        JSON.stringify({ changes_data: groupedChanges }, null, 2)
      );

      const rawResponse = await call.post('egrm.api.sync.push_changes', {
        changes_data: JSON.stringify(groupedChanges),
      });

      console.log(
        '[FrappeSyncManager] Raw backend response:',
        JSON.stringify(rawResponse, null, 2)
      );

      const response = extractApiResponse(rawResponse);
      console.log(
        '[FrappeSyncManager] Parsed backend response:',
        JSON.stringify(response, null, 2)
      );

      if (response.status === 'success') {
        const results = response.data;

        // Update local IDs with server IDs for created items
        if (results.created?.length > 0) {
          await this.updateLocalIdsWithServerIds(results.created);
        }

        // Remove successfully synced changes
        const processedLocalIds = new Set();
        const processedIds = new Set();

        // Track created items
        results.created?.forEach((item) => {
          processedLocalIds.add(item.local_id);
        });

        // Track updated items
        results.updated?.forEach((item) => {
          processedIds.add(item.id);
        });

        // Filter out processed changes
        this.pendingChanges = this.pendingChanges.filter((change) => {
          const wasCreated = change.local_id && processedLocalIds.has(change.local_id);
          const wasUpdated = change.id && processedIds.has(change.id);
          // Also remove any invalid entries
          const isValid = change.type && change.action && change.data;
          return !(wasCreated || wasUpdated) && isValid;
        });

        // Save updated pending changes
        await AsyncStorage.setItem(SYNC_KEYS.PENDING_CHANGES, JSON.stringify(this.pendingChanges));

        console.log(
          `Push completed: ${results.created?.length || 0} created, ${
            results.updated?.length || 0
          } updated, ${results.errors?.length || 0} errors`
        );

        if (results.errors?.length > 0) {
          console.warn('Push errors:', results.errors);
          // Optionally, you could retry failed changes or notify the user
        }
      } else {
        console.error('[FrappeSyncManager] Sync failed with message:', response.message);
        throw new Error(response.message || 'Failed to push changes');
      }
    } catch (error) {
      console.error('[FrappeSyncManager] Error pushing changes:', error);
      if (error && error.stack) {
        console.error('[FrappeSyncManager] Error stack:', error.stack);
      }
      throw error;
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
   * Create a new issue
   */
  async createIssue(issueData) {
    try {
      // Store locally first (offline-first approach)
      const localIssue = {
        _id: this.generateLocalId(),
        ...issueData,
        _local: true,
        created_date: new Date().toISOString(),
        modified_date: new Date().toISOString(),
      };

      await LocalGRMDatabase.put(localIssue);

      // If online, try to sync to server
      if (this.isOnline && this.credentials) {
        try {
          const call = this.getCall();

          // Convert to server format
          const serverData = {
            category: issueData.category,
            type: issueData.type,
            description: issueData.description,
            location: issueData.location,
            administrative_region: issueData.administrative_region,
            citizen_name: issueData.citizen_name,
            citizen_email: issueData.citizen_email,
            citizen_phone: issueData.citizen_phone,
            citizen_age_group: issueData.citizen_age_group,
            citizen_group: issueData.citizen_group,
            citizen_gender: issueData.citizen_gender,
            project: issueData.project,
            priority: issueData.priority || 'Medium',
            is_anonymous: issueData.is_anonymous || false,
            coordinates: issueData.coordinates
              ? `${issueData.coordinates.latitude},${issueData.coordinates.longitude}`
              : null,
          };

          const rawResponse = await call.post('egrm.api.issue.create', serverData);
          const response = extractApiResponse(rawResponse);

          if (response.status === 'success') {
            const serverIssue = response.data;

            // Update local document with server ID and data
            const updatedIssue = {
              ...localIssue,
              _id: serverIssue.name,
              name: serverIssue.name,
              _local: false,
              ...this.convertIssueFromServer(serverIssue),
            };

            // Remove the temporary local document
            await LocalGRMDatabase.remove(localIssue);

            // Add the updated document
            await LocalGRMDatabase.put(updatedIssue);

            console.log('Issue created and synced to server:', serverIssue.name);
            return updatedIssue;
          }
          // Server creation failed, add to pending changes
          console.log('Server creation failed, adding to pending changes');
          await this.addPendingChange({
            action: 'create',
            type: 'issue',
            data: serverData,
            local_id: localIssue._id,
          });
        } catch (error) {
          console.log('Server creation failed, adding to pending changes:', error.message);
          await this.addPendingChange({
            action: 'create',
            type: 'issue',
            data: issueData,
            local_id: localIssue._id,
          });
        }
      } else {
        // Offline - add to pending changes
        await this.addPendingChange({
          action: 'create',
          type: 'issue',
          data: issueData,
          local_id: localIssue._id,
        });
      }

      return localIssue;
    } catch (error) {
      console.error('Error creating issue:', error);
      throw error;
    }
  }

  /**
   * Update an existing issue
   */
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

      // If online and not a local-only issue, try to sync to server
      if (this.isOnline && this.credentials && !currentIssue._local) {
        try {
          const call = this.getCall();

          // Convert to server format (only send changed fields)
          const serverData = {};
          if (updateData.description !== undefined) serverData.description = updateData.description;
          if (updateData.category !== undefined) serverData.category = updateData.category;
          if (updateData.type !== undefined) serverData.type = updateData.type;
          if (updateData.priority !== undefined) serverData.priority = updateData.priority;
          if (updateData.location !== undefined) serverData.location = updateData.location;
          if (updateData.administrative_region !== undefined)
            serverData.administrative_region = updateData.administrative_region;
          if (updateData.coordinates !== undefined) {
            serverData.coordinates = updateData.coordinates
              ? `${updateData.coordinates.latitude},${updateData.coordinates.longitude}`
              : null;
          }

          const rawResponse = await call.post('egrm.api.issue.update', {
            issue_id: issueId,
            ...serverData,
          });

          const response = extractApiResponse(rawResponse);

          if (response.status === 'success') {
            console.log('Issue updated on server:', issueId);
          } else {
            // Server update failed, add to pending changes
            console.log('Server update failed, adding to pending changes');
            await this.addPendingChange({
              action: 'update',
              type: 'issue',
              id: issueId,
              data: updateData,
            });
          }
        } catch (error) {
          console.log('Server update failed, adding to pending changes:', error.message);
          await this.addPendingChange({
            action: 'update',
            type: 'issue',
            id: issueId,
            data: updateData,
          });
        }
      } else if (!currentIssue._local) {
        // Offline - add to pending changes
        await this.addPendingChange({
          action: 'update',
          type: 'issue',
          id: issueId,
          data: updateData,
        });
      }

      return updatedIssue;
    } catch (error) {
      console.error('Error updating issue:', error);
      throw error;
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
      title: serverIssue.title,
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
   * Update local IDs with server IDs
   */
  async updateLocalIdsWithServerIds(createdItems) {
    for (const item of createdItems) {
      try {
        // Get local document
        const database = item.type === 'issue' ? LocalGRMDatabase : LocalDatabase;
        const localDoc = await database.get(item.local_id);

        // Remove local document
        await database.remove(localDoc);

        // Create new document with server ID
        const serverDoc = {
          ...localDoc,
          _id: item.server_id,
          _local: false,
        };
        delete serverDoc._rev;

        await database.put(serverDoc);

        console.log(`Updated local ID ${item.local_id} to server ID ${item.server_id}`);
      } catch (error) {
        console.error(`Error updating local ID ${item.local_id}:`, error);
      }
    }
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
}

// Create singleton instance
const frappeSyncManager = new FrappeSyncManager();

export default frappeSyncManager;

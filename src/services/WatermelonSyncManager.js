import { synchronize } from '@nozbe/watermelondb/sync';
import Q from '@nozbe/watermelondb/QueryDescription';

/**
 * WatermelonDB Sync Manager
 * Implements the official WatermelonDB sync protocol to synchronize data
 * with the Frappe backend following the exact specification.
 */
class WatermelonSyncManager {
  constructor(database, frappeCall) {
    this.database = database;
    this.frappeCall = frappeCall; // Frappe SDK call instance from FrappeProvider
    this.syncInProgress = false;
    this.lastSyncTimestamp = null;
    this.syncListeners = [];
    // Track pending changes so UI can reactively show unsynced records
    this.pendingChangesCount = 0;

    // Immediately calculate initial pending changes (fire & forget)
    this.refreshPendingChanges();
  }

  /**
   * Main sync method - coordinates full synchronization
   */
  async sync() {
    console.log('🔄 [SYNC] Starting sync operation...');

    if (this.syncInProgress) {
      console.warn('⚠️ [SYNC] Sync already in progress, skipping...');
      throw new Error('Sync already in progress');
    }

    console.log('🔄 [SYNC] Setting sync in progress flag...');
    this.syncInProgress = true;

    console.log('🔄 [SYNC] Notifying listeners - sync starting...');
    this.notifyListeners({ phase: 'starting', progress: 0 });

    const syncStartTime = Date.now();

    try {
      console.log('🔄 [SYNC] Initializing WatermelonDB synchronize...');
      console.log('🔄 [SYNC] Database schema version:', this.database.schema.version);

      // Update progress
      this.notifyListeners({ phase: 'connecting', progress: 10 });

      console.log('🔄 [SYNC] Calling WatermelonDB synchronize function...');

      // Use WatermelonDB's standard synchronize function
      const syncResult = await synchronize({
        database: this.database,
        pullChanges: async (args) => {
          console.log('🔄 [SYNC] WatermelonDB calling pullChanges with args:', args);
          this.notifyListeners({ phase: 'pulling', progress: 30 });
          const result = await this.pullChanges(args);
          console.log('🔄 [SYNC] pullChanges completed, returning result to WatermelonDB');
          return result;
        },
        pushChanges: async (args) => {
          console.log('🔄 [SYNC] WatermelonDB calling pushChanges with args:', {
            hasChanges: !!args.changes,
            lastPulledAt: args.lastPulledAt,
            changeKeys: args.changes ? Object.keys(args.changes) : null,
          });
          this.notifyListeners({ phase: 'pushing', progress: 70 });
          const result = await this.pushChanges(args);
          console.log('🔄 [SYNC] pushChanges completed');
          return result;
        },
        migrationsEnabledAtVersion: this.database.schema.version,
        log: (message) => {
          console.log('🔄 [WATERMELON-LOG]', message);
        },
        // Add timeout to prevent hanging
        sendCreatedAsUpdated: false,
        // Allow WatermelonDB to handle conflict resolution
        conflictResolver: null,
      });

      // After a successful sync re-evaluate pending changes and notify listeners
      await this.refreshPendingChanges();

      console.log('🔄 [SYNC] WatermelonDB synchronize completed');
      console.log('🔄 [SYNC] Sync result:', syncResult);

      const syncDuration = Date.now() - syncStartTime;
      console.log(`🔄 [SYNC] Total sync duration: ${syncDuration}ms`);

      this.lastSyncTimestamp = new Date().toISOString();
      console.log('🔄 [SYNC] Updated last sync timestamp:', this.lastSyncTimestamp);


      console.log('🔄 [SYNC] Notifying listeners - sync completed...');
      this.notifyListeners({
        phase: 'completed',
        progress: 100,
        lastSync: this.lastSyncTimestamp,
        duration: syncDuration,
      });

      console.log('✅ [SYNC] Sync operation completed successfully');
    } catch (error) {
      const syncDuration = Date.now() - syncStartTime;
      console.error('❌ [SYNC] Sync operation failed after', syncDuration + 'ms');
      console.error('❌ [SYNC] Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        cause: error.cause,
      });

      console.log('🔄 [SYNC] Notifying listeners - sync error...');
      this.notifyListeners({
        phase: 'error',
        progress: 0,
        error: error.message,
        duration: syncDuration,
      });

      throw error;
    } finally {
      console.log('🔄 [SYNC] Clearing sync in progress flag...');
      this.syncInProgress = false;
      console.log('🔄 [SYNC] Sync cleanup completed');
    }
  }

  /**
   * Pull changes from server (WatermelonDB sync protocol)
   */
  async pullChanges({ lastPulledAt }) {
    console.log('📥 [PULL] Starting pull changes...');
    console.log('📥 [PULL] Last pulled at:', lastPulledAt);

    const pullStartTime = Date.now();
    let apiCallDuration = 0;
    let responseProcessingDuration = 0;

    try {
      const params = lastPulledAt ? { lastPulledAt } : {};

      console.log('📥 [PULL] Making API call to pull_changes with params:', params);

      // Start timing the API call specifically
      const apiStartTime = Date.now();
      console.log('📥 [PULL] Calling frappeCall.get...');

      // Make API call to backend sync endpoint
      const response = await this.frappeCall.get('egrm.api.sync.pull_changes', params);
      console.log('***** RESPONSE *****');
      apiCallDuration = Date.now() - apiStartTime;
      console.log(
        `📥 [PULL] API call completed in ${apiCallDuration}ms (${(apiCallDuration / 1000).toFixed(
          2
        )}s)`
      );

      // Start timing response processing
      const processStartTime = Date.now();
      console.log('📥 [PULL] Processing API response...');

      // Log response structure for debugging
      console.log('📥 [PULL] Raw response received:', typeof response);
      console.log('📥 [PULL] Response object structure:', {
        hasResponse: !!response,
        responseType: typeof response,
        responseKeys: response ? Object.keys(response) : null,
        hasData: !!response?.data,
        hasMessage: !!response?.message,
        status: response?.status,
        hasStatus: !!response?.status,
      });

      // Enhanced response preview for debugging
      if (response) {
        const responseStr = JSON.stringify(response).substring(0, 200);
        console.log('📥 [PULL] Response preview (first 200 chars):', responseStr);
      }

      console.log('📥 [PULL] Processing response data...');

      // Extract data from Frappe response format
      let responseData;
      if (response?.message) {
        responseData = response.message;
      } else if (response?.data) {
        responseData = response.data;
      } else {
        responseData = response;
      }

      // Validate response structure
      console.log('📥 [PULL] Response data extracted:', {
        hasResponseData: !!responseData,
        responseDataType: typeof responseData,
        responseDataKeys: responseData ? Object.keys(responseData) : null,
        hasChanges: !!responseData?.changes,
        hasTimestamp: !!responseData?.timestamp,
        changesType: typeof responseData?.changes,
        timestampType: typeof responseData?.timestamp,
        timestamp: responseData?.timestamp,
      });

      if (!responseData || !responseData.changes) {
        console.error('❌ [PULL] Invalid response format - missing changes object');
        throw new Error('Invalid response format: missing changes object');
      }

      console.log('📥 [PULL] Changes and timestamp extracted successfully');

      // Log sync data statistics
      console.log('📥 [PULL] Received sync data:');
      console.log(
        `📅 [PULL] Server timestamp: ${
          responseData.timestamp
        } (type: ${typeof responseData.timestamp})`
      );

      console.log('📊 [PULL] Changes summary:');
      console.log('📊 [PULL] Processing changes object...');

      let totalCreated = 0;
      let totalUpdated = 0;
      let totalDeleted = 0;

      Object.entries(responseData.changes).forEach(([tableName, tableChanges]) => {
        console.log(`📊 [PULL] Processing table: ${tableName}`);

        const created = tableChanges.created?.length || 0;
        const updated = tableChanges.updated?.length || 0;
        const deleted = tableChanges.deleted?.length || 0;

        totalCreated += created;
        totalUpdated += updated;
        totalDeleted += deleted;

        console.log(`📊 [PULL] ${tableName}: +${created} ~${updated} -${deleted}`);

        // Show sample record for debugging (without sensitive data)
        if (created > 0) {
          const sampleRecord = tableChanges.created[0];
          const sampleInfo = {
            id: sampleRecord?.id,
            fieldCount: sampleRecord ? Object.keys(sampleRecord).length : 0,
            _status: sampleRecord?._status,
            _changed: sampleRecord?._changed,
          };
          console.log(`📄 [PULL] ${tableName} sample created record:`, sampleInfo);

          // Check for prohibited fields
          if (sampleRecord?._status || sampleRecord?._changed) {
            console.error(
              `❌ [PULL] CRITICAL: ${tableName} contains prohibited WatermelonDB internal fields!`
            );
            console.error(
              `❌ [PULL] _status: ${sampleRecord._status}, _changed: ${sampleRecord._changed}`
            );
          }
        }
      });

      console.log(`📊 [PULL] Total changes: +${totalCreated} ~${totalUpdated} -${totalDeleted}`);

      responseProcessingDuration = Date.now() - processStartTime;
      console.log(`📊 [PULL] Response processing completed in ${responseProcessingDuration}ms`);

      console.log('📥 [PULL] Building return object...');

      const returnData = {
        changes: responseData.changes,
        timestamp: responseData.timestamp,
      };

      console.log('📥 [PULL] Return data prepared:', {
        hasChanges: !!returnData.changes,
        hasTimestamp: !!returnData.timestamp,
        timestampValue: returnData.timestamp,
      });

      const totalPullDuration = Date.now() - pullStartTime;

      // Performance breakdown logging
      console.log('⏱️ [PULL] Performance Summary:');
      console.log(
        `⏱️ [PULL] Total pull duration: ${totalPullDuration}ms (${(
          totalPullDuration / 1000
        ).toFixed(2)}s)`
      );
      console.log(
        `⏱️ [PULL] API call duration: ${apiCallDuration}ms (${(
          (apiCallDuration / totalPullDuration) *
          100
        ).toFixed(1)}%)`
      );
      console.log(
        `⏱️ [PULL] Response processing: ${responseProcessingDuration}ms (${(
          (responseProcessingDuration / totalPullDuration) *
          100
        ).toFixed(1)}%)`
      );

      // Performance analysis
      if (apiCallDuration > 10000) {
        // > 10 seconds
        console.warn(
          `⚠️ [PULL] SLOW API: Backend took ${(apiCallDuration / 1000).toFixed(1)}s to respond`
        );
      }
      if (responseProcessingDuration > 5000) {
        // > 5 seconds
        console.warn(
          `⚠️ [PULL] SLOW PROCESSING: Frontend took ${(responseProcessingDuration / 1000).toFixed(
            1
          )}s to process response`
        );
      }

      console.log('✅ [PULL] Pull changes completed successfully');
      return returnData;
    } catch (error) {
      const totalPullDuration = Date.now() - pullStartTime;
      console.error(`❌ [PULL] Pull changes failed after ${totalPullDuration}ms`);
      console.error('❌ [PULL] Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        cause: error.cause,
      });

      // Performance breakdown even on error
      console.error('⏱️ [PULL] Performance at failure:');
      console.error(`⏱️ [PULL] API call duration: ${apiCallDuration}ms`);
      console.error(`⏱️ [PULL] Response processing: ${responseProcessingDuration}ms`);
      console.error(`⏱️ [PULL] Total duration: ${totalPullDuration}ms`);

      throw new Error(`Pull failed: ${error.message}`);
    }
  }

  /**
   * Push changes to server (WatermelonDB sync protocol)
   */
  async pushChanges({ changes, lastPulledAt }) {
    console.log('📤 [PUSH] Starting push changes...');
    console.log('📤 [PUSH] Last pulled at:', lastPulledAt);
    console.log('📤 [PUSH] Changes to push:', {
      hasChanges: !!changes,
      changesType: typeof changes,
      tableCount: changes ? Object.keys(changes).length : 0,
      tableNames: changes ? Object.keys(changes) : null,
    });

    // Log detailed push statistics
    if (changes) {
      let totalCreated = 0;
      let totalUpdated = 0;
      let totalDeleted = 0;

      console.log('📤 [PUSH] Analyzing changes to push...');

      Object.entries(changes).forEach(([tableName, tableChanges]) => {
        const created = tableChanges.created?.length || 0;
        const updated = tableChanges.updated?.length || 0;
        const deleted = tableChanges.deleted?.length || 0;

        totalCreated += created;
        totalUpdated += updated;
        totalDeleted += deleted;

        console.log(`📤 [PUSH] ${tableName}: +${created} ~${updated} -${deleted}`);

        // Log sample records for debugging
        if (created > 0 && tableChanges.created[0]) {
          console.log(`📄 [PUSH] ${tableName} sample created record:`, {
            id: tableChanges.created[0].id,
            _status: tableChanges.created[0]._status,
            _changed: tableChanges.created[0]._changed,
            fieldCount: Object.keys(tableChanges.created[0]).length,
          });
        }
      });

      console.log(
        `📤 [PUSH] Total changes to push: +${totalCreated} ~${totalUpdated} -${totalDeleted}`
      );

      if (totalCreated === 0 && totalUpdated === 0 && totalDeleted === 0) {
        console.log('📤 [PUSH] No changes to push to server');
      }
    }

    try {
      console.log('📤 [PUSH] Preparing push data...');

      // ------------------------------------------------------------------
      // 🔄 1. Filter changes → Issue Actions sync: grm_issues (created/updated) and 
      //       child tables (grm_issue_logs, grm_issue_comments created only)
      // ------------------------------------------------------------------
      let filteredChanges = {};
      let hasChangesToPush = false;

      // Handle grm_issues table - accept both created and updated records
      if (changes?.grm_issues) {
        const issueCreated = changes.grm_issues.created || [];
        const issueUpdated = changes.grm_issues.updated || [];

        if (issueCreated.length > 0 || issueUpdated.length > 0) {
          filteredChanges.grm_issues = {
            created: issueCreated,
            updated: issueUpdated,
            deleted: [],
          };
          hasChangesToPush = true;
          console.log(`📤 [PUSH] grm_issues: +${issueCreated.length} ~${issueUpdated.length}`);
        }
      }

      // Handle grm_issue_logs table - accept created records only
      if (changes?.grm_issue_logs) {
        const logsCreated = changes.grm_issue_logs.created || [];

        if (logsCreated.length > 0) {
          filteredChanges.grm_issue_logs = {
            created: logsCreated,
            updated: [],
            deleted: [],
          };
          hasChangesToPush = true;
          console.log(`📤 [PUSH] grm_issue_logs: +${logsCreated.length}`);
        }
      }

      // Handle grm_issue_comments table - accept created records only
      if (changes?.grm_issue_comments) {
        const commentsCreated = changes.grm_issue_comments.created || [];

        if (commentsCreated.length > 0) {
          filteredChanges.grm_issue_comments = {
            created: commentsCreated,
            updated: [],
            deleted: [],
          };
          hasChangesToPush = true;
          console.log(`📤 [PUSH] grm_issue_comments: +${commentsCreated.length}`);
        }
      }

      // If no Issue Actions changes exist, simply return – nothing to push
      if (!hasChangesToPush) {
        console.log('📤 [PUSH] No Issue Actions changes to push – skipping backend call.');
        return; // WatermelonDB treats void as success
      }

      const pushData = {
        changes: filteredChanges,
        lastPulledAt,
      };

      console.log('📤 [PUSH] Push data prepared:', {
        hasChanges: !!pushData.changes,
        hasLastPulledAt: !!pushData.lastPulledAt,
        lastPulledAt: pushData.lastPulledAt,
        lastPulledAtType: typeof pushData.lastPulledAt,
      });

      // Start timing the API call
      const startTime = Date.now();

      console.log('📤 [PUSH] Making API call to push_changes...');

      // Use Frappe SDK for API calls
      const response = await this.frappeCall.post('egrm.api.sync.push_changes', pushData);

      const apiCallDuration = Date.now() - startTime;
      console.log(`📤 [PUSH] API call completed in ${apiCallDuration}ms`);

      console.log('📤 [PUSH] Push response received:', {
        hasResponse: !!response,
        responseType: typeof response,
        status: response?.status,
        hasMessage: !!response?.message,
        hasData: !!response?.data,
        responseKeys: response ? Object.keys(response) : null,
      });

      // Log response details for debugging
      if (response) {
        try {
          const responseStr = JSON.stringify(response);
          console.log('📤 [PUSH] Response preview:', responseStr.substring(0, 100) + '...');
        } catch (stringifyError) {
          console.log('📤 [PUSH] Could not stringify response:', stringifyError.message);
        }
      }

      console.log('✅ [PUSH] Push changes completed successfully');

      // WatermelonDB expects void return from pushChanges per spec
    } catch (error) {
      console.error('❌ [PUSH] Push changes failed:', error);
      console.error('❌ [PUSH] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        response: error.response?.data,
      });

      // Log additional debugging info for HTTP errors
      if (error.response) {
        console.error('❌ [PUSH] HTTP Error Response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data,
        });
      }

      throw new Error(`Push failed: ${error.message}`);
    }
  }

  /**
   * Get current sync status
   * @returns {Object} - Sync status information
   */
  getSyncStatus() {
    return {
      isActive: this.syncInProgress,
      lastSync: this.lastSyncTimestamp,
      pendingChangesCount: this.pendingChangesCount,
    };
  }

  /**
   * Expose a lightweight synchronous getter for cached pending changes count.
   */
  getPendingChangesCount() {
    return this.pendingChangesCount;
  }

  /**
   * Add listener for sync status updates
   * @param {Function} listener - Callback function for status updates
   */
  addSyncListener(listener) {
    this.syncListeners.push(listener);
  }

  /**
   * Remove sync status listener
   * @param {Function} listener - Listener to remove
   */
  removeSyncListener(listener) {
    const index = this.syncListeners.indexOf(listener);
    if (index > -1) {
      this.syncListeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of sync status changes
   * @param {Object} status - Status update
   */
  notifyListeners(status) {
    this.syncListeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error notifying sync listener:', error);
      }
    });
  }

  /**
   * Check if sync is available (has Frappe connection)
   * @returns {boolean}
   */
  isAvailable() {
    return !!this.frappeCall && !!this.database;
  }

  /**
   * Perform a test sync to validate connectivity
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    try {
      console.log('🔧 [SYNC_TEST] Testing sync connection...');
      // Try to pull with empty timestamp to test connection
      const result = await this.pullChanges({ lastPulledAt: '' });
      const isValid = !!(result && result.changes);
      console.log('🔧 [SYNC_TEST] Connection test result:', isValid);
      return isValid;
    } catch (error) {
      console.error('❌ [SYNC_TEST] Sync connection test failed:', error);
      return false;
    }
  }

  /**
   * Calculate how many records across all collections are not yet synced
   * (_status !== 'synced'). Returns an object containing total count and
   * per-table breakdown.
   */
  async calculatePendingChanges() {
    const result = {};
    let total = 0;

    try {
      const { collections } = this.database;
      for (const [tableName, collection] of Object.entries(collections)) {
        try {
          const created = await collection.query().where('_status', 'created').fetchCount();
          const updated = await collection.query().where('_status', 'updated').fetchCount();
          const deleted = await collection.query().where('_status', 'deleted').fetchCount();

          if (created || updated || deleted) {
            result[tableName] = { created, updated, deleted };
            total += created + updated + deleted;
          }
        } catch (tableErr) {
          // Skip table if any error occurs, but log for debugging
          console.warn(`⚠️ [PENDING] Failed to inspect collection ${tableName}:`, tableErr.message);
        }
      }
    } catch (err) {
      console.error('❌ [PENDING] Failed to calculate pending changes:', err);
    }

    return { total, tables: result };
  }

  /**
   * Refresh cached pending changes count and notify listeners so that UI can
   * react accordingly. This method is intentionally public so callers can
   * force a recount when they know data changed locally (e.g. after creating
   * a new issue).
   */
  async refreshPendingChanges() {
    const { total, tables } = await this.calculatePendingChanges();

    this.pendingChangesCount = total;

    // Notify listeners of updated pending changes info
    this.notifyListeners({ pendingChangesCount: total, pendingChangesByTable: tables });
  }
}

export default WatermelonSyncManager;

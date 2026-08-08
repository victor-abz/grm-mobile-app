import { synchronize } from '@nozbe/watermelondb/sync';
import { Q } from '@nozbe/watermelondb';
import * as FileSystem from 'expo-file-system';
import { logger } from '../utils/logger';

/**
 * Tables whose emptiness means the device holds no usable data at all.
 *
 * Categories, types and statuses are global reference data that every user
 * receives, so all four being empty means a blank database — a fresh install,
 * cleared app data, or a restore — rather than a user who simply has no
 * assignments yet. That distinction matters: the check must not fire forever
 * for a legitimately unassigned user.
 */
const BOOTSTRAP_TABLES = [
  'grm_projects',
  'grm_issue_categories',
  'grm_issue_types',
  'grm_issue_statuses',
];

/**
 * Tables the server reconciles against the user's entitlements on every
 * incremental pull. Reporting how many rows we hold lets the server notice a
 * device that is missing older records and replay them by itself, instead of
 * the user having to discover the manual recovery button. Must stay in step
 * with RECONCILED_SYNC_TABLES in egrm/api/sync.py.
 */
const RECONCILED_TABLES = [...BOOTSTRAP_TABLES, 'grm_issue_departments'];

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
    // Set by syncFull() to make the next pull replay the whole back catalogue
    // regardless of the watermark WatermelonDB has stored.
    this.forceFullSync = false;

    // Immediately calculate initial pending changes (fire & forget)
    this.refreshPendingChanges();
  }

  /**
   * Main sync method - coordinates full synchronization
   */
  async sync() {
    logger.info('WatermelonSyncManager: Starting sync operation');

    if (this.syncInProgress) {
      logger.warn('WatermelonSyncManager: Sync already in progress, skipping');
      throw new Error('Sync already in progress');
    }

    logger.info('WatermelonSyncManager: Setting sync in progress flag');
    this.syncInProgress = true;

    logger.info('WatermelonSyncManager: Notifying listeners - sync starting');
    this.notifyListeners({ phase: 'starting', progress: 0 });

    const syncStartTime = Date.now();

    try {
      logger.info('WatermelonSyncManager: Initializing WatermelonDB synchronize', {
        schemaVersion: this.database.schema.version,
      });

      // Update progress
      this.notifyListeners({ phase: 'connecting', progress: 10 });

      logger.info('WatermelonSyncManager: Calling WatermelonDB synchronize function');

      // Use WatermelonDB's standard synchronize function
      const syncResult = await synchronize({
        database: this.database,
        pullChanges: async (args) => {
          logger.info('WatermelonSyncManager: WatermelonDB calling pullChanges', { args });
          this.notifyListeners({ phase: 'pulling', progress: 30 });
          const result = await this.pullChanges(args);
          logger.info(
            'WatermelonSyncManager: pullChanges completed, returning result to WatermelonDB'
          );
          return result;
        },
        pushChanges: async (args) => {
          logger.info('WatermelonSyncManager: WatermelonDB calling pushChanges', {
            hasChanges: !!args.changes,
            lastPulledAt: args.lastPulledAt,
            changeKeys: args.changes ? Object.keys(args.changes) : null,
          });
          this.notifyListeners({ phase: 'pushing', progress: 70 });
          const result = await this.pushChanges(args);
          logger.info('WatermelonSyncManager: pushChanges completed');
          return result;
        },
        migrationsEnabledAtVersion: this.database.schema.version,
        log: (message) => {
          logger.debug('WatermelonSyncManager: WatermelonDB log', { message });
        },
        // Add timeout to prevent hanging
        sendCreatedAsUpdated: false,
        // Allow WatermelonDB to handle conflict resolution
        conflictResolver: null,
      });

      // After a successful sync re-evaluate pending changes and notify listeners
      await this.refreshPendingChanges();

      logger.info('WatermelonSyncManager: WatermelonDB synchronize completed', { syncResult });

      const syncDuration = Date.now() - syncStartTime;
      logger.performance('WatermelonSyncManager: Total sync completed', syncDuration, {
        lastSync: this.lastSyncTimestamp,
      });

      this.lastSyncTimestamp = new Date().toISOString();
      logger.info('WatermelonSyncManager: Updated last sync timestamp', {
        lastSyncTimestamp: this.lastSyncTimestamp,
      });

      logger.info('WatermelonSyncManager: Notifying listeners - sync completed');
      this.notifyListeners({
        phase: 'completed',
        progress: 100,
        lastSync: this.lastSyncTimestamp,
        duration: syncDuration,
      });

      logger.info('WatermelonSyncManager: Sync operation completed successfully');
    } catch (error) {
      const syncDuration = Date.now() - syncStartTime;
      logger.error('WatermelonSyncManager: Sync operation failed', error, {
        syncDuration,
        errorName: error.name,
        errorCause: error.cause,
      });

      logger.info('WatermelonSyncManager: Notifying listeners - sync error');
      this.notifyListeners({
        phase: 'error',
        progress: 0,
        error: error.message,
        duration: syncDuration,
      });

      throw error;
    } finally {
      logger.info('WatermelonSyncManager: Clearing sync in progress flag');
      this.syncInProgress = false;
      logger.info('WatermelonSyncManager: Sync cleanup completed');
    }
  }

  /**
   * Sync, replaying the entire history the user is entitled to.
   *
   * For recovery when a device is missing data an incremental pull can no
   * longer supply — the watermark has already moved past the records that
   * never arrived, so no ordinary sync will ever fetch them.
   */
  async syncFull() {
    this.forceFullSync = true;
    try {
      return await this.sync();
    } finally {
      this.forceFullSync = false;
    }
  }

  /**
   * True when none of the core reference tables hold a single record, i.e. the
   * device has nothing to work with regardless of what the watermark claims.
   *
   * Errs towards false: a failure here must not turn every sync into a full
   * pull.
   */
  async isLocalDatabaseEmpty() {
    try {
      const counts = await Promise.all(
        BOOTSTRAP_TABLES.map((table) => this.database.get(table).query().fetchCount())
      );
      return counts.every((count) => count === 0);
    } catch (error) {
      logger.warn('WatermelonSyncManager: Could not determine local database state', error);
      return false;
    }
  }

  /**
   * Row counts for the reference tables the server reconciles against.
   *
   * Returns null on failure so the pull proceeds without the safety net rather
   * than failing outright.
   */
  async getReconciliationCounts() {
    try {
      const counts = await Promise.all(
        RECONCILED_TABLES.map((table) => this.database.get(table).query().fetchCount())
      );
      return RECONCILED_TABLES.reduce(
        (acc, table, index) => ({ ...acc, [table]: counts[index] }),
        {}
      );
    } catch (error) {
      logger.warn('WatermelonSyncManager: Could not collect reconciliation counts', error);
      return null;
    }
  }

  /**
   * Pull changes from server (WatermelonDB sync protocol)
   */
  async pullChanges({ lastPulledAt }) {
    logger.info('WatermelonSyncManager: Starting pull changes', { lastPulledAt });

    const pullStartTime = Date.now();
    let apiCallDuration = 0;
    let responseProcessingDuration = 0;

    try {
      // A stored watermark does not prove the device still holds the data that
      // watermark accounts for. After a reinstall or a cleared database the
      // watermark survives in sync metadata while the tables are empty, and an
      // incremental pull would return only the last few hours of deltas —
      // leaving the user with no projects and so no visible issues. Ask for the
      // full history instead; the server still scopes it to their assignments.
      const needsBootstrap = lastPulledAt ? await this.isLocalDatabaseEmpty() : false;
      const fullSync = this.forceFullSync || needsBootstrap;

      const params = {};
      if (fullSync) {
        params.fullSync = 1;
      } else if (lastPulledAt) {
        params.lastPulledAt = lastPulledAt;
        // Tell the server what we already hold. An incremental pull describes
        // only the window since the watermark, so it can never repair a device
        // that is short on older records — the server compares these counts to
        // the user's entitlements and replays the back catalogue on its own if
        // they don't line up.
        const localCounts = await this.getReconciliationCounts();
        if (localCounts) {
          params.counts = JSON.stringify(localCounts);
        }
      }

      if (fullSync) {
        logger.info('WatermelonSyncManager: Requesting a full pull', {
          reason: this.forceFullSync ? 'requested' : 'empty local database',
          discardedWatermark: lastPulledAt,
        });
      }

      logger.info('WatermelonSyncManager: Making API call to pull_changes', { params });

      // Start timing the API call specifically
      const apiStartTime = Date.now();
      logger.info('WatermelonSyncManager: Calling frappeCall.get');

      // Make API call to backend sync endpoint
      const response = await this.frappeCall.get('egrm.api.sync.pull_changes', params);
      apiCallDuration = Date.now() - apiStartTime;
      logger.apiCall('WatermelonSyncManager: pull_changes API completed', {
        endpoint: 'egrm.api.sync.pull_changes',
        duration: apiCallDuration,
        params,
      });

      // Start timing response processing
      const processStartTime = Date.now();
      logger.info('WatermelonSyncManager: Processing API response');

      // Log response structure for debugging
      logger.debug('WatermelonSyncManager: Response structure analysis', {
        responseType: typeof response,
        hasResponse: !!response,
        responseKeys: response ? Object.keys(response) : null,
        hasData: !!response?.data,
        hasMessage: !!response?.message,
        status: response?.status,
      });

      logger.info('WatermelonSyncManager: Processing response data');

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
      logger.debug('WatermelonSyncManager: Response data extracted', {
        hasResponseData: !!responseData,
        responseDataType: typeof responseData,
        responseDataKeys: responseData ? Object.keys(responseData) : null,
        hasChanges: !!responseData?.changes,
        hasTimestamp: !!responseData?.timestamp,
        timestamp: responseData?.timestamp,
      });

      if (!responseData || !responseData.changes) {
        logger.error('WatermelonSyncManager: Invalid response format - missing changes object');
        throw new Error('Invalid response format: missing changes object');
      }

      logger.info('WatermelonSyncManager: Changes and timestamp extracted successfully');

      // The server upgrades an incremental pull to a full replay when it can
      // see the device is missing records or the user's scope just widened.
      // Surface that so a silent recovery is still traceable in the logs.
      if (responseData.fullSync && !fullSync) {
        logger.info('WatermelonSyncManager: Server upgraded this pull to a full replay', {
          reason: responseData.fullSyncReason,
          requestedWatermark: lastPulledAt,
        });
      }

      // Log sync data statistics
      logger.info('WatermelonSyncManager: Received sync data', {
        serverTimestamp: responseData.timestamp,
        timestampType: typeof responseData.timestamp,
      });

      logger.info('WatermelonSyncManager: Processing changes summary');

      let totalCreated = 0;
      let totalUpdated = 0;
      let totalDeleted = 0;

      Object.entries(responseData.changes).forEach(([tableName, tableChanges]) => {
        const created = tableChanges.created?.length || 0;
        const updated = tableChanges.updated?.length || 0;
        const deleted = tableChanges.deleted?.length || 0;

        totalCreated += created;
        totalUpdated += updated;
        totalDeleted += deleted;

        logger.info('WatermelonSyncManager: Processing table changes', {
          tableName,
          created,
          updated,
          deleted,
        });

        // Show sample record for debugging (without sensitive data)
        if (created > 0) {
          const [sampleRecord] = tableChanges.created;
          const sampleInfo = {
            id: sampleRecord?.id,
            fieldCount: sampleRecord ? Object.keys(sampleRecord).length : 0,
            _status: sampleRecord?._status,
            _changed: sampleRecord?._changed,
          };
          logger.debug('WatermelonSyncManager: Sample created record', {
            tableName,
            sampleInfo,
          });

          // Check for prohibited fields
          if (sampleRecord?._status || sampleRecord?._changed) {
            logger.error(
              'WatermelonSyncManager: CRITICAL - prohibited WatermelonDB internal fields found',
              null,
              {
                tableName,
                _status: sampleRecord._status,
                _changed: sampleRecord._changed,
              }
            );
          }
        }
      });

      logger.info('WatermelonSyncManager: Total changes summary', {
        totalCreated,
        totalUpdated,
        totalDeleted,
      });

      responseProcessingDuration = Date.now() - processStartTime;
      logger.performance(
        'WatermelonSyncManager: Response processing completed',
        responseProcessingDuration
      );

      logger.info('WatermelonSyncManager: Building return object for WatermelonDB');

      const returnData = {
        changes: responseData.changes,
        timestamp: responseData.timestamp,
      };

      logger.info('WatermelonSyncManager: Return data prepared', {
        hasChanges: !!returnData.changes,
        hasTimestamp: !!returnData.timestamp,
        timestampValue: returnData.timestamp,
      });

      const totalPullDuration = Date.now() - pullStartTime;

      // Performance breakdown logging
      logger.performance('WatermelonSyncManager: Pull performance summary', totalPullDuration, {
        apiCallDuration,
        responseProcessingDuration,
        apiCallPercentage: ((apiCallDuration / totalPullDuration) * 100).toFixed(1),
        processingPercentage: ((responseProcessingDuration / totalPullDuration) * 100).toFixed(1),
      });

      // Performance analysis
      if (apiCallDuration > 10000) {
        // > 10 seconds
        logger.warn('WatermelonSyncManager: Slow API response detected', {
          apiCallDuration,
          apiCallSeconds: (apiCallDuration / 1000).toFixed(1),
          threshold: '10 seconds',
        });
      }
      if (responseProcessingDuration > 5000) {
        // > 5 seconds
        logger.warn('WatermelonSyncManager: Slow response processing detected', {
          responseProcessingDuration,
          processingSeconds: (responseProcessingDuration / 1000).toFixed(1),
          threshold: '5 seconds',
        });
      }

      logger.info('WatermelonSyncManager: Pull changes completed successfully');

      // Process attachments that have file data (both created and updated)
      if (returnData.changes?.grm_issue_attachments) {
        const allAttachments = [
          ...(returnData.changes.grm_issue_attachments.created || []),
          ...(returnData.changes.grm_issue_attachments.updated || []),
        ];

        if (allAttachments.length > 0) {
          await this.processNewAttachmentsForDownload(allAttachments);
        }
      }

      return returnData;
    } catch (error) {
      const totalPullDuration = Date.now() - pullStartTime;
      logger.error('WatermelonSyncManager: Pull changes failed', error, {
        totalPullDuration,
        errorName: error.name,
        errorCause: error.cause,
        apiCallDuration,
        responseProcessingDuration,
      });

      throw new Error(`Pull failed: ${error.message}`);
    }
  }

  /**
   * Push changes to server (WatermelonDB sync protocol)
   */
  async pushChanges({ changes, lastPulledAt }) {
    logger.info('WatermelonSyncManager: Starting push changes', {
      lastPulledAt,
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

      logger.info('WatermelonSyncManager: Analyzing changes to push');

      Object.entries(changes).forEach(([tableName, tableChanges]) => {
        const created = tableChanges.created?.length || 0;
        const updated = tableChanges.updated?.length || 0;
        const deleted = tableChanges.deleted?.length || 0;

        totalCreated += created;
        totalUpdated += updated;
        totalDeleted += deleted;

        logger.info('WatermelonSyncManager: Table changes breakdown', {
          tableName,
          created,
          updated,
          deleted,
        });

        // Log sample records for debugging
        if (created > 0 && tableChanges.created[0]) {
          logger.debug('WatermelonSyncManager: Sample created record', {
            tableName,
            sampleRecord: {
              id: tableChanges.created[0].id,
              _status: tableChanges.created[0]._status,
              _changed: tableChanges.created[0]._changed,
              fieldCount: Object.keys(tableChanges.created[0]).length,
            },
          });
        }
      });

      logger.info('WatermelonSyncManager: Total changes summary for push', {
        totalCreated,
        totalUpdated,
        totalDeleted,
      });

      if (totalCreated === 0 && totalUpdated === 0 && totalDeleted === 0) {
        logger.info('WatermelonSyncManager: No changes to push to server');
      }
    }

    try {
      logger.info('WatermelonSyncManager: Preparing push data for backend');

      // ------------------------------------------------------------------
      // 🔄 1. Filter changes → Issue Actions sync: grm_issues (created/updated) and
      //       child tables (grm_issue_logs, grm_issue_comments, grm_issue_attachments created only)
      // ------------------------------------------------------------------
      const filteredChanges = {};
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
          logger.info('WatermelonSyncManager: Including grm_issues changes', {
            created: issueCreated.length,
            updated: issueUpdated.length,
          });
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
          logger.info('WatermelonSyncManager: Including grm_issue_logs changes', {
            created: logsCreated.length,
          });
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
          logger.info('WatermelonSyncManager: Including grm_issue_comments changes', {
            created: commentsCreated.length,
          });
        }
      }

      // Handle grm_issue_attachments table - accept created records only
      if (changes?.grm_issue_attachments) {
        const attachmentsCreated = changes.grm_issue_attachments.created || [];

        if (attachmentsCreated.length > 0) {
          // Process attachments with file data
          const processedAttachments =
            await this.processAttachmentsWithFileData(attachmentsCreated);

          filteredChanges.grm_issue_attachments = {
            created: processedAttachments,
            updated: [],
            deleted: [],
          };
          hasChangesToPush = true;
          logger.info('WatermelonSyncManager: Including grm_issue_attachments changes', {
            created: processedAttachments.length,
          });
        }
      }

      // If no Issue Actions changes exist, simply return – nothing to push
      if (!hasChangesToPush) {
        logger.info(
          'WatermelonSyncManager: No Issue Actions changes to push, skipping backend call'
        );
        return; // WatermelonDB treats void as success
      }

      const pushData = {
        changes: filteredChanges,
        lastPulledAt,
      };

      logger.info('WatermelonSyncManager: Push data prepared for API call', {
        hasChanges: !!pushData.changes,
        hasLastPulledAt: !!pushData.lastPulledAt,
        lastPulledAt: pushData.lastPulledAt,
        lastPulledAtType: typeof pushData.lastPulledAt,
      });

      // Start timing the API call
      const startTime = Date.now();

      logger.info('WatermelonSyncManager: Making API call to push_changes endpoint');

      // Use Frappe SDK for API calls
      const response = await this.frappeCall.post('egrm.api.sync.push_changes', pushData);

      const apiCallDuration = Date.now() - startTime;
      logger.apiCall('WatermelonSyncManager: push_changes API completed', {
        endpoint: 'egrm.api.sync.push_changes',
        duration: apiCallDuration,
      });

      logger.info('WatermelonSyncManager: Push response received', {
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
          logger.debug('WatermelonSyncManager: Response preview', {
            responsePreview: `${responseStr.substring(0, 100)}...`,
          });
        } catch (stringifyError) {
          logger.debug('WatermelonSyncManager: Could not stringify response', {
            error: stringifyError.message,
          });
        }
      }

      logger.info('WatermelonSyncManager: Push changes completed successfully');

      // Process file URLs returned from backend for attachments
      if (response?.file_urls?.grm_issue_attachments) {
        await this.processFileUrlsResponse(response.file_urls.grm_issue_attachments);
      }

      // WatermelonDB expects void return from pushChanges per spec
    } catch (error) {
      logger.error('WatermelonSyncManager: Push changes failed', error, {
        errorName: error.name,
        response: error.response?.data,
      });

      // Enhanced error handling for different types of failures
      if (error.code === 'NETWORK_ERROR' || error.message.includes('network')) {
        logger.error('WatermelonSyncManager: Network error during push, changes will be retried', {
          errorCode: error.code,
        });
        throw new Error('Network error during push. Changes will be retried on next sync.');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        logger.error(
          'WatermelonSyncManager: Request timeout during push, changes will be retried',
          {
            errorCode: error.code,
          }
        );
        throw new Error('Request timeout during push. Changes will be retried on next sync.');
      } else if (error.response) {
        logger.error('WatermelonSyncManager: HTTP error response received', {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data,
        });

        // Handle specific HTTP error codes
        if (error.response.status === 413) {
          throw new Error('File too large for upload. Please reduce file size and try again.');
        } else if (error.response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (error.response.status === 403) {
          throw new Error('Permission denied. You do not have access to upload files.');
        } else if (error.response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
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
        logger.error('WatermelonSyncManager: Error notifying sync listener', error);
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
      logger.info('WatermelonSyncManager: Testing sync connection');
      // Try to pull with empty timestamp to test connection
      const result = await this.pullChanges({ lastPulledAt: '' });
      const isValid = !!(result && result.changes);
      logger.info('WatermelonSyncManager: Connection test completed', { isValid });
      return isValid;
    } catch (error) {
      logger.error('WatermelonSyncManager: Sync connection test failed', error);
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
      const tableNames = Object.keys(this.database.schema.tables);

      // Create concurrent queries for all collections using schema table names
      const collectionPromises = tableNames.map(async (tableName) => {
        try {
          const collection = this.database.get(tableName);
          const [created, updated, deleted] = await Promise.all([
            collection.query(Q.where('_status', 'created')).fetchCount(),
            collection.query(Q.where('_status', 'updated')).fetchCount(),
            collection.query(Q.where('_status', 'deleted')).fetchCount(),
          ]);

          if (created || updated || deleted) {
            return {
              tableName,
              counts: { created, updated, deleted },
              total: created + updated + deleted,
            };
          }
          return null;
        } catch (tableErr) {
          logger.warn('WatermelonSyncManager: Failed to inspect collection for pending changes', {
            tableName,
            error: tableErr.message,
          });
          return null;
        }
      });

      // Wait for all collection queries to complete
      const collectionResults = await Promise.all(collectionPromises);

      // Process results
      collectionResults.forEach((collectionResult) => {
        if (collectionResult) {
          result[collectionResult.tableName] = collectionResult.counts;
          total += collectionResult.total;
        }
      });
    } catch (err) {
      logger.error('WatermelonSyncManager: Failed to calculate pending changes', err);
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

  /**
   * Process attachments with file data for upload
   * @param {Array} attachments - Array of attachment records
   * @returns {Promise<Array>} - Processed attachments with file data
   */
  async processAttachmentsWithFileData(attachments) {
    logger.info('WatermelonSyncManager: Processing attachments with file data for upload', {
      attachmentCount: attachments.length,
    });

    const processedAttachments = [];

    for (const attachment of attachments) {
      try {
        // Check if attachment has local file that needs to be uploaded
        // Look for local files (file://) that haven't been uploaded yet
        const hasLocalFile = attachment.local_url && attachment.local_url.startsWith('file://');
        const isNotUploaded = !attachment.uploaded;
        const hasNoServerUrl = !attachment.server_url;

        const isUnuploaded = hasLocalFile && isNotUploaded && hasNoServerUrl;

        logger.debug('WatermelonSyncManager: Checking attachment upload status', {
          fileName: attachment.file_name,
          hasLocalFile,
          isNotUploaded,
          hasNoServerUrl,
          isUnuploaded,
          local_url: attachment.local_url,
          server_url: attachment.server_url,
          uploaded: attachment.uploaded,
        });

        if (isUnuploaded) {
          logger.info('WatermelonSyncManager: Processing unuploaded file', {
            fileName: attachment.file_name,
          });

          // Read file data from local storage
          const fileData = await FileSystem.readAsStringAsync(attachment.local_url, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Create enhanced attachment record with file data
          const enhancedAttachment = {
            ...attachment,
            file_data: fileData,
            needs_upload: true,
          };

          processedAttachments.push(enhancedAttachment);
          logger.info('WatermelonSyncManager: Added file data for attachment', {
            fileName: attachment.file_name,
          });
        } else {
          // Attachment already uploaded or no local file, pass through
          processedAttachments.push(attachment);
          logger.debug('WatermelonSyncManager: Attachment already uploaded or no local file', {
            fileName: attachment.file_name,
          });
        }
      } catch (error) {
        logger.error('WatermelonSyncManager: Error processing attachment file data', error, {
          fileName: attachment.file_name,
        });
      }
    }

    logger.info('WatermelonSyncManager: Completed processing attachments', {
      processedCount: processedAttachments.length,
      originalCount: attachments.length,
    });
    return processedAttachments;
  }

  /**
   * Process file URLs returned from backend and update local database
   * @param {Object} fileUrls - Map of attachment IDs to file URLs
   */
  async processFileUrlsResponse(fileUrls) {
    logger.info('WatermelonSyncManager: Processing file URLs response from backend', {
      fileUrlCount: Object.keys(fileUrls).length,
    });

    try {
      const db = this.database;

      await db.write(async () => {
        for (const [attachmentId, fileUrl] of Object.entries(fileUrls)) {
          try {
            const attachment = await db.get('grm_issue_attachments').find(attachmentId);

            await attachment.update((record) => {
              record.serverUrl = fileUrl;
              record.uploaded = true;
            });

            logger.info('WatermelonSyncManager: Updated attachment with server URL', {
              attachmentId,
              fileUrl,
            });
          } catch (error) {
            logger.error(
              'WatermelonSyncManager: Error updating attachment with server URL',
              error,
              {
                attachmentId,
              }
            );
          }
        }
      });

      logger.info('WatermelonSyncManager: Successfully processed file URLs', {
        processedCount: Object.keys(fileUrls).length,
      });
    } catch (error) {
      logger.error('WatermelonSyncManager: Error processing file URLs response', error);
    }
  }

  /**
   * Process new attachments from backend that include file data
   * @param {Array} attachments - Array of attachment records from backend
   */
  async processNewAttachmentsForDownload(attachments) {
    logger.info('WatermelonSyncManager: Processing new attachments for download', {
      totalAttachments: attachments.length,
    });

    try {
      const attachmentsWithData = attachments.filter(
        (attachment) => attachment.file_data // Has base64 file data - remove local_url check to allow re-downloads
      );

      logger.info('WatermelonSyncManager: Found attachments with file data', {
        attachmentsWithDataCount: attachmentsWithData.length,
      });

      if (attachmentsWithData.length === 0) {
        logger.info('WatermelonSyncManager: No attachments have file data to save');
        return;
      }

      // Process file saves concurrently
      const savePromises = attachmentsWithData.map((attachment) =>
        this.saveAttachmentFileData(attachment)
      );

      const results = await Promise.allSettled(savePromises);

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      logger.info('WatermelonSyncManager: File save results', {
        successful,
        failed,
      });

      // Log failed saves
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          logger.error('WatermelonSyncManager: Failed to save attachment file', result.reason, {
            attachmentId: attachmentsWithData[index].id,
          });
        }
      });
    } catch (error) {
      logger.error('WatermelonSyncManager: Error processing attachments file data', error);
    }
  }

  /**
   * Save base64 file data directly to local storage
   * @param {Object} attachment - Attachment record with base64 file data
   * @returns {Promise<boolean>} - Success status
   */
  async saveAttachmentFileData(attachment) {
    logger.info('WatermelonSyncManager: Saving file data for attachment', {
      attachmentId: attachment.id,
    });

    try {
      const fileData = attachment.file_data;
      const fileName = attachment.file_name || `attachment_${attachment.id}`;

      if (!fileData) {
        throw new Error('No file data provided for attachment');
      }

      // Use the same directory structure as the app's camera/recording functionality
      // This ensures consistency with how the app expects files to be stored
      const documentsDir = FileSystem.documentDirectory;
      const localPath = `${documentsDir}${attachment.id}_${fileName}`;

      logger.debug('WatermelonSyncManager: Saving file data to local path', {
        localPath,
      });

      // Save base64 data directly to file (no subdirectories to match app pattern)
      await FileSystem.writeAsStringAsync(localPath, fileData, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Verify file was created successfully
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (!fileInfo.exists) {
        throw new Error(`File was not created successfully: ${localPath}`);
      }

      logger.info('WatermelonSyncManager: File saved successfully', {
        fileName,
        fileSize: fileInfo.size,
        localPath,
      });

      // Update the attachment record with the correct local file URI
      // Use the actual local path that the app can access
      await this.updateAttachmentLocalPath(attachment.id, localPath);

      return true;
    } catch (error) {
      logger.error('WatermelonSyncManager: Error saving attachment file data', error, {
        attachmentId: attachment.id,
      });

      // Enhanced error handling for save failures
      if (error.code === 'EACCES') {
        throw new Error(`Permission denied writing file ${attachment.file_name}.`);
      } else if (error.code === 'ENOSPC') {
        throw new Error(`Not enough storage space to save ${attachment.file_name}.`);
      } else if (error.message.includes('Invalid base64')) {
        throw new Error(`Invalid file data for ${attachment.file_name}.`);
      }

      throw error;
    }
  }

  /**
   * Update attachment record with local file path
   * @param {string} attachmentId - Attachment ID
   * @param {string} localPath - Local file path
   */
  async updateAttachmentLocalPath(attachmentId, localPath) {
    try {
      const db = this.database;

      await db.write(async () => {
        const attachment = await db.get('grm_issue_attachments').find(attachmentId);

        await attachment.update((record) => {
          record.localUrl = localPath;
        });
      });

      logger.info('WatermelonSyncManager: Updated attachment with local path', {
        attachmentId,
        localPath,
      });
    } catch (error) {
      logger.error('WatermelonSyncManager: Error updating attachment local path', error, {
        attachmentId,
      });
      throw error;
    }
  }
}

export default WatermelonSyncManager;

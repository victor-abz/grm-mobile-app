import watermelonManager from '../database/watermelonManager';
import { logger } from '../utils/logger';

/**
 * Lookup Data Manager - Pure Sync-First Approach
 *
 * This service manages all lookup data (categories, types, statuses, etc.) using
 * WatermelonDB sync as the single source of truth. No direct API calls - all data
 * comes from local WatermelonDB after sync.
 */
class LookupDataManager {
  constructor() {
    this.syncManager = null;
    this.credentials = null;
    this.lastSyncStatus = { isActive: false, lastSync: null };
  }

  /**
   * Initialize with sync manager and credentials
   */
  async initialize(syncManager, credentials) {
    logger.info('LookupDataManager: Initializing', {
      hasCredentials: !!credentials,
      hasSyncManager: !!syncManager,
    });

    this.syncManager = syncManager;
    this.credentials = credentials;

    if (syncManager) {
      logger.info('LookupDataManager: Initialized with sync manager');
    } else {
      logger.warn('LookupDataManager: Initialized without sync manager');
    }
  }

  /**
   * Get data using sync-first approach
   * 1. Check local WatermelonDB first
   * 2. If empty and credentials available, trigger sync
   * 3. Return data from local DB (post-sync if triggered)
   */
  async getData(type) {
    logger.info('LookupDataManager: Getting data', { type });

    try {
      // Step 1: Check local data first
      let data = await this.getFromLocalDB(type);
      logger.info('LookupDataManager: Found local data', {
        type,
        recordCount: data.length,
      });

      // Step 2: If no local data and we have credentials, try sync
      if (data.length === 0 && this.credentials && this.syncManager) {
        logger.info('LookupDataManager: No local data found, triggering sync', { type });

        try {
          await this.syncManager.sync();
          logger.info('LookupDataManager: Sync completed, retrying', { type });

          // Retry after sync
          data = await this.getFromLocalDB(type);
          logger.info('LookupDataManager: Found data after sync', {
            type,
            recordCount: data.length,
          });
        } catch (syncError) {
          logger.error('LookupDataManager: Sync failed', syncError, { type });
          // Continue with empty data - don't throw
        }
      } else if (data.length === 0) {
        logger.warn('LookupDataManager: No data available and no sync capability', { type });
      }

      logger.info('LookupDataManager: Returning data', {
        type,
        recordCount: data.length,
      });
      return data;
    } catch (error) {
      logger.error('LookupDataManager: Error getting data', error, { type });
      return [];
    }
  }

  /**
   * Get data from local WatermelonDB
   */
  async getFromLocalDB(type) {
    try {
      logger.database('getFromLocalDB', type, 0, { type });

      const tableName = this.getTableName(type);
      if (!tableName) {
        logger.error('LookupDataManager: Unknown data type', null, { type });
        return [];
      }

      const database = watermelonManager.getDatabase();
      if (!database) {
        logger.error('LookupDataManager: Database not available');
        return [];
      }

      const collection = database.get(tableName);
      const records = await collection.query().fetch();

      logger.info('LookupDataManager: Records fetched from local DB', {
        type,
        tableName,
        recordCount: records.length,
      });

      // Log sample record for debugging
      if (records.length > 0) {
        const sample = records[0];
        logger.debug('LookupDataManager: Sample record', {
          type,
          sampleRecord: {
            id: sample.id,
            name: sample.name || sample.title || sample.label || 'N/A',
            created_at: sample.created_at,
            updated_at: sample.updated_at,
          },
        });
      }

      // Convert WatermelonDB records to plain objects
      const data = records.map((record) => ({
        id: record.id,
        name: record.name || record.title || record.label,
        ...record._raw,
      }));

      logger.info('LookupDataManager: Records converted to plain objects', {
        type,
        convertedCount: data.length,
      });
      return data;
    } catch (error) {
      logger.error('LookupDataManager: Error fetching from local DB', error, { type });
      return [];
    }
  }

  /**
   * Get table name for data type
   */
  static getTableName(type) {
    const tableMap = {
      categories: 'grm_issue_categories',
      types: 'grm_issue_types',
      statuses: 'grm_issue_statuses',
      departments: 'grm_issue_departments',
      age_groups: 'grm_issue_age_groups',
      citizen_groups: 'grm_issue_citizen_groups',
      escalation_reasons: 'grm_issue_escalation_reasons',
      projects: 'grm_projects',
      regions: 'grm_administrative_regions',
      admin_levels: 'grm_administrative_level_types',
    };

    const tableName = tableMap[type];
    logger.debug('LookupDataManager: Table mapping', {
      type,
      tableName: tableName || 'UNKNOWN',
    });
    return tableName;
  }

  /**
   * Force sync and refresh all lookup data
   */
  async refreshData() {
    console.log('🔄 [LOOKUP] Force refreshing all lookup data...');

    if (!this.syncManager) {
      console.warn('⚠️ [LOOKUP] Cannot refresh - no sync manager available');
      return false;
    }

    try {
      await this.syncManager.sync();
      console.log('✅ [LOOKUP] Data refresh completed');
      return true;
    } catch (error) {
      console.error('❌ [LOOKUP] Data refresh failed:', error);
      return false;
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    if (this.syncManager) {
      const status = this.syncManager.getSyncStatus();
      console.log('📊 [LOOKUP] Current sync status:', status);
      return status;
    }
    console.log('📊 [LOOKUP] No sync manager - returning offline status');
    return { isActive: false, lastSync: null };
  }

  /**
   * Test sync connectivity
   */
  async testSync() {
    console.log('🔧 [LOOKUP] Testing sync connectivity...');

    if (!this.syncManager) {
      console.warn('⚠️ [LOOKUP] Cannot test sync - no sync manager available');
      return false;
    }

    try {
      const result = await this.syncManager.testConnection();
      console.log('🔧 [LOOKUP] Sync test result:', result);
      return result;
    } catch (error) {
      console.error('❌ [LOOKUP] Sync test failed:', error);
      return false;
    }
  }

  getIssueCategories() {
    console.log('📋 [LOOKUP] Getting issue categories...');
    return this.getData('categories');
  }

  getIssueTypes() {
    console.log('📋 [LOOKUP] Getting issue types...');
    return this.getData('types');
  }

  getIssueStatuses() {
    console.log('📋 [LOOKUP] Getting issue statuses...');
    return this.getData('statuses');
  }

  getIssueDepartments() {
    console.log('📋 [LOOKUP] Getting issue departments...');
    return this.getData('departments');
  }

  getIssueAgeGroups() {
    console.log('📋 [LOOKUP] Getting issue age groups...');
    return this.getData('age_groups');
  }

  getIssueCitizenGroups() {
    console.log('📋 [LOOKUP] Getting issue citizen groups...');
    return this.getData('citizen_groups');
  }

  getIssueEscalationReasons() {
    console.log('📋 [LOOKUP] Getting issue escalation reasons...');
    return this.getData('escalation_reasons');
  }

  getProjects() {
    console.log('📋 [LOOKUP] Getting projects...');
    return this.getData('projects');
  }

  getAdministrativeRegions() {
    console.log('📋 [LOOKUP] Getting administrative regions...');
    return this.getData('regions');
  }

  getAdministrativeLevelTypes() {
    console.log('📋 [LOOKUP] Getting administrative level types...');
    return this.getData('admin_levels');
  }

  /**
   * Get local data counts for debugging
   */
  getDataCounts() {
    console.log('📊 [LOOKUP] Getting data counts for debugging...');

    const types = [
      'categories',
      'types',
      'statuses',
      'departments',
      'age_groups',
      'citizen_groups',
      'escalation_reasons',
      'projects',
      'regions',
      'admin_levels',
    ];

    const counts = {};

    for (const type of types) {
      try {
        const data = this.getFromLocalDB(type);
        counts[type] = data.length;
        console.log(`📊 [LOOKUP] ${type}: ${data.length} records`);
      } catch (error) {
        console.error(`❌ [LOOKUP] Error counting ${type}:`, error);
        counts[type] = 'error';
      }
    }

    console.log('📊 [LOOKUP] Data counts summary:', counts);
    return counts;
  }
}

// Create and export singleton instance
const lookupDataManager = new LookupDataManager();
export default lookupDataManager;

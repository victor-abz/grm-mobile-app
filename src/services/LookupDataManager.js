import watermelonManager from '../database/watermelonManager';

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
    console.log('🔧 [LOOKUP] Initializing LookupDataManager...');
    console.log('🔧 [LOOKUP] Credentials available:', !!credentials);
    console.log('🔧 [LOOKUP] Sync manager available:', !!syncManager);

    this.syncManager = syncManager;
    this.credentials = credentials;

    if (syncManager) {
      console.log('✅ [LOOKUP] LookupDataManager initialized with sync manager');
    } else {
      console.warn('⚠️ [LOOKUP] LookupDataManager initialized without sync manager');
    }
  }

  /**
   * Get data using sync-first approach
   * 1. Check local WatermelonDB first
   * 2. If empty and credentials available, trigger sync
   * 3. Return data from local DB (post-sync if triggered)
   */
  async getData(type) {
    console.log(`🔍 [LOOKUP] Getting ${type} data...`);

    try {
      // Step 1: Check local data first
      console.log(`🔍 [LOOKUP] Checking local ${type} data...`);
      let data = await this.getFromLocalDB(type);
      console.log(`🔍 [LOOKUP] Found ${data.length} ${type} records in local DB`);

      // Step 2: If no local data and we have credentials, try sync
      if (data.length === 0 && this.credentials && this.syncManager) {
        console.log(`🔄 [LOOKUP] No local ${type} data found, triggering sync...`);

        try {
          await this.syncManager.sync();
          console.log(`✅ [LOOKUP] Sync completed, retrying ${type} data from local DB...`);

          // Retry after sync
          data = await this.getFromLocalDB(type);
          console.log(`🔍 [LOOKUP] Found ${data.length} ${type} records after sync`);
        } catch (syncError) {
          console.error(`❌ [LOOKUP] Sync failed for ${type}:`, syncError);
          // Continue with empty data - don't throw
        }
      } else if (data.length === 0) {
        console.warn(`⚠️ [LOOKUP] No ${type} data available and no sync capability`);
      }

      console.log(`📊 [LOOKUP] Returning ${data.length} ${type} records`);
      return data;
    } catch (error) {
      console.error(`❌ [LOOKUP] Error getting ${type} data:`, error);
      return [];
    }
  }

  /**
   * Get data from local WatermelonDB
   */
  async getFromLocalDB(type) {
    try {
      console.log(`📱 [LOOKUP_LOCAL] Fetching ${type} from WatermelonDB...`);

      const tableName = this.getTableName(type);
      if (!tableName) {
        console.error(`❌ [LOOKUP_LOCAL] Unknown data type: ${type}`);
        return [];
      }

      console.log(`📱 [LOOKUP_LOCAL] Using table: ${tableName}`);

      const database = watermelonManager.getDatabase();
      if (!database) {
        console.error('❌ [LOOKUP_LOCAL] Database not available');
        return [];
      }

      const collection = database.get(tableName);
      const records = await collection.query().fetch();

      console.log(`📱 [LOOKUP_LOCAL] Found ${records.length} records in ${tableName}`);

      // Log sample record for debugging
      if (records.length > 0) {
        const [sample] = records;
        console.log(`📱 [LOOKUP_LOCAL] Sample ${type} record:`, {
          id: sample.id,
          name: sample.name || sample.title || sample.label || 'N/A',
          created_at: sample.created_at,
          updated_at: sample.updated_at,
          ...sample._raw,
        });
      }

      // Convert WatermelonDB records to plain objects
      const data = records.map((record) => ({
        id: record.id,
        name: record.name || record.title || record.label,
        ...record._raw,
      }));

      console.log(`📱 [LOOKUP_LOCAL] Converted ${data.length} records to plain objects`);
      return data;
    } catch (error) {
      console.error(`❌ [LOOKUP_LOCAL] Error fetching ${type} from local DB:`, error);
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
    console.log(`🗂️ [LOOKUP_TABLE] Mapping ${type} → ${tableName}`);
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

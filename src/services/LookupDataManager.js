import AsyncStorage from '@react-native-async-storage/async-storage';
import { of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { Q } from '@nozbe/watermelondb';

// Storage keys for persistent lookup data
const STORAGE_KEYS = {
  SYNC_TIMESTAMP: 'lookup_sync_timestamp',
  CACHE_VERSION: 'lookup_cache_version',
};

// Cache version for data invalidation
const CACHE_VERSION = '1.0.2';

/**
 * Reactive Lookup Data Manager
 * Uses WatermelonDB as single source of truth with reactive queries
 * Sync happens in background without blocking reads
 */
class LookupDataManager {
  constructor() {
    this.isInitialized = false;
    this.isOnline = true;
    this.syncInProgress = false;
    this.credentials = null;
    this.watermelonManager = null;
    this.dataManager = null;
  }

  /**
   * Initialize the lookup data manager
   */
  async initialize(credentials = null, projectId = null) {
    try {
      console.log('🔄 LookupDataManager: Initializing...');

      // Import dependencies
      const { default: watermelonManager } = await import('../database/watermelonManager');
      this.watermelonManager = watermelonManager;

      this.credentials = credentials;
      this.isInitialized = true;

      console.log('✅ LookupDataManager initialized');

      // Start background sync if credentials are available (non-blocking)
      if (credentials) {
        console.log('🔄 LookupDataManager: Starting background sync...');
        this.performBackgroundSync(projectId).catch((error) => {
          console.warn('⚠️ Background sync failed:', error.message);
        });
      } else {
        console.log('🔄 LookupDataManager: No credentials provided, using local data only...');
      }

      return {
        success: true,
        message: 'LookupDataManager initialized successfully',
      };
    } catch (error) {
      console.error('❌ Error initializing LookupDataManager:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get data reactively from WatermelonDB - primary method
   */
  async getData(dataType, projectId = null) {
    try {
      if (!this.watermelonManager) {
        const { default: watermelonManager } = await import('../database/watermelonManager');
        this.watermelonManager = watermelonManager;
      }

      let data = [];

      switch (dataType) {
        case 'categories':
          data = await this.watermelonManager.getIssueCategories(projectId);
          break;
        case 'types':
          data = await this.watermelonManager.getIssueTypes(projectId);
          break;
        case 'statuses':
          data = await this.watermelonManager.getIssueStatuses();
          break;
        case 'age_groups':
          data = await this.watermelonManager.getAgeGroups();
          console.log('HERHEHREHREH', data);
          break;
        case 'citizen_groups':
          data = await this.watermelonManager.getCitizenGroups();
          break;
        case 'departments':
          data = await this.watermelonManager.getDepartments();
          break;
        case 'projects':
          data = await this.watermelonManager.getProjects();
          break;
        case 'regions':
          data = await this.watermelonManager.getAdministrativeRegions({ project_id: projectId });
          break;
        default:
          console.warn(`Unknown data type: ${dataType}`);
          return [];
      }

      console.log(
        `📱 [${dataType.toUpperCase()}] Returning ${data.length} items from WatermelonDB`
      );
      return data;
    } catch (error) {
      console.error(`❌ Error getting ${dataType} from WatermelonDB:`, error);
      return [];
    }
  }

  /**
   * Get reactive observable for data type - Return raw Frappe data directly
   */
  observeData(dataType, projectId = null) {
    try {
      if (!this.watermelonManager) {
        return of([]);
      }

      const db = this.watermelonManager.getDatabase();

      switch (dataType) {
        case 'categories':
          return db
            .get('grm_issue_categories')
            .query()
            .observe()
            .pipe(
              switchMap((records) =>
                of(
                  records
                    .filter((r) => r && r._raw) // Filter out null records
                    .map((r) => ({
                      ...r._raw,
                      name: r._raw.id || r._raw.name, // Ensure Frappe name field
                    }))
                )
              ),
              catchError((error) => {
                console.error(`Error observing ${dataType}:`, error);
                return of([]);
              })
            );
        case 'types':
          return db
            .get('grm_issue_types')
            .query()
            .observe()
            .pipe(
              switchMap((records) =>
                of(
                  records
                    .filter((r) => r && r._raw) // Filter out null records
                    .map((r) => ({
                      ...r._raw,
                      name: r._raw.id || r._raw.name, // Ensure Frappe name field
                    }))
                )
              ),
              catchError((error) => {
                console.error(`Error observing ${dataType}:`, error);
                return of([]);
              })
            );
        case 'statuses':
          return db
            .get('grm_issue_statuses')
            .query()
            .observe()
            .pipe(
              switchMap((records) =>
                of(
                  records
                    .filter((r) => r && r._raw) // Filter out null records
                    .map((r) => ({
                      ...r._raw,
                      name: r._raw.id || r._raw.name, // Ensure Frappe name field
                    }))
                )
              ),
              catchError((error) => {
                console.error(`Error observing ${dataType}:`, error);
                return of([]);
              })
            );
        case 'age_groups':
          return db
            .get('grm_issue_age_groups')
            .query()
            .observe()
            .pipe(
              switchMap((records) =>
                of(
                  records
                    .filter((r) => r && r._raw) // Filter out null records
                    .map((r) => ({
                      ...r._raw,
                      name: r._raw.id || r._raw.name, // Ensure Frappe name field
                    }))
                )
              ),
              catchError((error) => {
                console.error(`Error observing ${dataType}:`, error);
                return of([]);
              })
            );
        case 'citizen_groups':
          return db
            .get('grm_issue_citizen_groups')
            .query()
            .observe()
            .pipe(
              switchMap((records) =>
                of(
                  records
                    .filter((r) => r && r._raw) // Filter out null records
                    .map((r) => ({
                      ...r._raw,
                      name: r._raw.id || r._raw.name, // Ensure Frappe name field
                    }))
                )
              ),
              catchError((error) => {
                console.error(`Error observing ${dataType}:`, error);
                return of([]);
              })
            );
        case 'departments':
          return db
            .get('grm_issue_departments')
            .query()
            .observe()
            .pipe(
              switchMap((records) =>
                of(
                  records
                    .filter((r) => r && r._raw) // Filter out null records
                    .map((r) => ({
                      ...r._raw,
                      name: r._raw.id || r._raw.name, // Ensure Frappe name field
                    }))
                )
              ),
              catchError((error) => {
                console.error(`Error observing ${dataType}:`, error);
                return of([]);
              })
            );
        case 'projects':
          return db
            .get('grm_projects')
            .query()
            .observe()
            .pipe(
              switchMap((records) =>
                of(
                  records
                    .filter((r) => r && r._raw) // Filter out null records
                    .map((r) => ({
                      ...r._raw,
                      name: r._raw.id || r._raw.name, // Ensure Frappe name field
                    }))
                )
              ),
              catchError((error) => {
                console.error(`Error observing ${dataType}:`, error);
                return of([]);
              })
            );
        case 'regions':
          const query = projectId
            ? db.get('grm_administrative_regions').query(Q.where('project_id', projectId))
            : db.get('grm_administrative_regions').query();
          return query.observe().pipe(
            switchMap((records) =>
              of(
                records
                  .filter((r) => r && r._raw) // Filter out null records
                  .map((r) => ({
                    ...r._raw,
                    name: r._raw.id || r._raw.name, // Ensure Frappe name field
                  }))
              )
            ),
            catchError((error) => {
              console.error(`Error observing ${dataType}:`, error);
              return of([]);
            })
          );
        default:
          console.warn(`Unknown data type for observation: ${dataType}`);
          return of([]);
      }
    } catch (error) {
      console.error(`❌ Error setting up observation for ${dataType}:`, error);
      return of([]);
    }
  }

  // Specific data getter methods (always from WatermelonDB)
  async getCategories(projectId = null) {
    return await this.getData('categories', projectId);
  }

  async getTypes(projectId = null) {
    return await this.getData('types', projectId);
  }

  async getStatuses() {
    return await this.getData('statuses');
  }

  async getAgeGroups() {
    return await this.getData('age_groups');
  }

  async getCitizenGroups() {
    return await this.getData('citizen_groups');
  }

  async getDepartments() {
    return await this.getData('departments');
  }

  async getProjects() {
    return await this.getData('projects');
  }

  async getRegions(filters = {}) {
    const projectId = filters.project || filters.project_id;
    return await this.getData('regions', projectId);
  }

  // Reactive observable methods
  observeCategories(projectId = null) {
    return this.observeData('categories', projectId);
  }

  observeTypes(projectId = null) {
    return this.observeData('types', projectId);
  }

  observeStatuses() {
    return this.observeData('statuses');
  }

  observeAgeGroups() {
    return this.observeData('age_groups');
  }

  observeCitizenGroups() {
    return this.observeData('citizen_groups');
  }

  observeDepartments() {
    return this.observeData('departments');
  }

  observeProjects() {
    return this.observeData('projects');
  }

  observeRegions(filters = {}) {
    const projectId = filters.project || filters.project_id;
    return this.observeData('regions', projectId);
  }

  /**
   * Background sync - non-blocking
   */
  async performBackgroundSync(projectId = null) {
    // Prevent multiple simultaneous syncs
    if (this.syncInProgress) {
      console.log('⚠️ Sync already in progress, skipping...');
      return;
    }

    try {
      this.syncInProgress = true;
      console.log('🔄 Starting background lookup data sync...');

      // Import DataManager dynamically to avoid circular dependency
      if (!this.dataManager) {
        const { default: DataManager } = await import('./DataManager');
        this.dataManager = DataManager;
      }

      // Only sync if we have credentials and are online
      if (!this.credentials || !this.isOnline) {
        console.log('⚠️ No credentials or offline, skipping sync');
        return;
      }

      // Sync lookup data through DataManager's API methods
      const dataTypes = ['statuses', 'age_groups', 'citizen_groups', 'departments', 'projects'];

      for (const dataType of dataTypes) {
        try {
          console.log(`🔄 Background syncing ${dataType}...`);
          await this.syncDataType(dataType);
          console.log(`✅ Background sync ${dataType} completed`);
        } catch (error) {
          console.warn(`⚠️ Failed to sync ${dataType}:`, error.message);
        }
      }

      // Sync project-specific data if projectId is provided
      if (projectId) {
        const projectSpecificTypes = ['categories', 'types', 'regions'];
        for (const dataType of projectSpecificTypes) {
          try {
            console.log(`🔄 Background syncing ${dataType} for project ${projectId}...`);
            await this.syncDataType(dataType, projectId);
            console.log(`✅ Background sync ${dataType} completed`);
          } catch (error) {
            console.warn(`⚠️ Failed to sync ${dataType} for project ${projectId}:`, error.message);
          }
        }
      }

      await this.updateSyncTimestamp();
      console.log('✅ Background lookup data sync completed');
    } catch (error) {
      console.error('❌ Error during background sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync specific data type through DataManager's LookupAPI
   */
  async syncDataType(dataType, projectId = null) {
    try {
      // Import LookupAPI from DataManager
      const { LookupAPI } = await import('./DataManager');

      if (!this.dataManager?.call) {
        console.warn(`⚠️ No API connection available for syncing ${dataType}`);
        return;
      }

      let data = [];

      switch (dataType) {
        case 'categories':
          data = await LookupAPI.getCategories(this.dataManager.call, projectId);
          break;
        case 'types':
          data = await LookupAPI.getTypes(this.dataManager.call, projectId);
          break;
        case 'statuses':
          data = await LookupAPI.getStatuses(this.dataManager.call);
          break;
        case 'age_groups':
          data = await LookupAPI.getAgeGroups(this.dataManager.call);
          break;
        case 'citizen_groups':
          data = await LookupAPI.getCitizenGroups(this.dataManager.call);
          break;
        case 'departments':
          data = await LookupAPI.getDepartments(this.dataManager.call);
          break;
        case 'projects':
          data = await LookupAPI.getProjects(this.dataManager.call);
          break;
        case 'regions':
          data = await LookupAPI.getRegions(this.dataManager.call, { project_id: projectId });
          break;
        default:
          console.warn(`Unknown data type for sync: ${dataType}`);
          return;
      }

      if (data.length > 0) {
        await LookupAPI.storeLookupData(dataType, data);
        console.log(`✅ Background synced ${data.length} ${dataType} records`);
      }
    } catch (error) {
      console.error(`❌ Error syncing ${dataType}:`, error);
      throw error;
    }
  }

  /**
   * Update sync timestamp
   */
  async updateSyncTimestamp() {
    try {
      const timestamp = new Date().toISOString();
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_TIMESTAMP, timestamp);
    } catch (error) {
      console.error('❌ Error updating sync timestamp:', error);
    }
  }

  /**
   * Get last sync timestamp
   */
  async getLastSyncTimestamp() {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.SYNC_TIMESTAMP);
    } catch (error) {
      console.error('❌ Error getting sync timestamp:', error);
      return null;
    }
  }

  /**
   * Set online status
   */
  setOnlineStatus(isOnline) {
    this.isOnline = isOnline;

    // Start background sync when coming online
    if (isOnline && this.credentials && !this.syncInProgress) {
      this.performBackgroundSync().catch((error) => {
        console.warn('⚠️ Auto-sync on reconnect failed:', error.message);
      });
    }
  }

  /**
   * Manual refresh trigger (still non-blocking)
   */
  async refresh(projectId = null) {
    console.log('🔄 Manual refresh triggered...');
    return this.performBackgroundSync(projectId);
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      syncInProgress: this.syncInProgress,
      isOnline: this.isOnline,
      hasCredentials: !!this.credentials,
      isInitialized: this.isInitialized,
    };
  }
}

// Create singleton instance
const lookupDataManager = new LookupDataManager();

export default lookupDataManager;

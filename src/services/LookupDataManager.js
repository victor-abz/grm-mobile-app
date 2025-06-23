import AsyncStorage from '@react-native-async-storage/async-storage';
import dataManager from './DataManager';

// Storage keys for persistent lookup data
const STORAGE_KEYS = {
  CATEGORIES: 'lookup_categories',
  TYPES: 'lookup_types',
  STATUSES: 'lookup_statuses',
  AGE_GROUPS: 'lookup_age_groups',
  CITIZEN_GROUPS: 'lookup_citizen_groups',
  DEPARTMENTS: 'lookup_departments',
  PROJECTS: 'lookup_projects',
  REGIONS: 'lookup_regions',
  SYNC_TIMESTAMP: 'lookup_sync_timestamp',
  CACHE_VERSION: 'lookup_cache_version',
};

// Cache version for data invalidation
const CACHE_VERSION = '1.0.1';

/**
 * Helper function to extract data from API response
 */
function extractApiResponse(response) {
  if (response?.response?.message) {
    const { message } = response.response;
    return {
      status: message.status,
      data: message.data,
      message: message.message || (message.status === 'success' ? 'Success' : 'Error'),
    };
  }

  if (response?.message?.status) {
    const { message } = response;
    return {
      status: message.status,
      data: message.data,
      message: message.message || (message.status === 'success' ? 'Success' : 'Error'),
    };
  }

  if (response?.status) {
    return {
      status: response.status,
      data: response.data,
      message: response.message || (response.status === 'success' ? 'Success' : 'Error'),
    };
  }

  if (response && !response.status && !response.response && !response.message) {
    return {
      status: 'success',
      data: response,
      message: 'Success',
    };
  }

  return {
    status: 'error',
    data: null,
    message: 'Invalid response format',
  };
}

/**
 * Generic data transformer configuration
 */
const DATA_TRANSFORMERS = {
  categories: (item) => ({
    _id: item.name,
    type: 'issue_category',
    id: item.name,
    name: item.category_name,
    label: item.category_name,
    value: item.name,
    description: item.description,
    department: item.department,
    department_name: item.department_name,
    assigned_department: item.assigned_department,
    auto_assign: item.auto_assign,
    active: item.active,
  }),

  types: (item) => ({
    _id: item.name,
    type: 'issue_type',
    id: item.name,
    name: item.type_name || item.issue_type_name,
    label: item.type_name || item.issue_type_name,
    value: item.name,
    description: item.description,
    active: item.active,
  }),

  statuses: (item) => ({
    _id: item.name,
    type: 'issue_status',
    id: item.name,
    name: item.status_name,
    label: item.status_name,
    value: item.name,
    description: item.description,
    initial_status: item.initial_status,
    open_status: item.open_status,
    rejected_status: item.rejected_status,
    final_status: item.final_status,
    appealed_status: item.appealed_status,
    color: item.color,
  }),

  age_groups: (item) => ({
    _id: item.name,
    type: 'age_group',
    id: item.name,
    name: item.age_group || item.age_group_name,
    label: item.age_group || item.age_group_name,
    value: item.name,
    active: item.active !== undefined ? item.active : 1,
    description: item.description || '',
    order: parseInt(item.order) || 0,
  }),

  citizen_groups: (item) => ({
    _id: item.name,
    type: 'citizen_group',
    id: item.name,
    name: item.group_name || item.name,
    label: item.group_name || item.name,
    value: item.name,
    description: item.description || '',
    group_type: item.group_type ? item.group_type.toString() : '1',
    active: item.active !== undefined ? item.active : 1,
    order: parseInt(item.order) || 0,
    parent_group: item.parent_group || null,
  }),

  departments: (item) => ({
    _id: item.name,
    type: 'department',
    id: item.name,
    name: item.department_name,
    label: item.department_name,
    value: item.name,
    description: item.description || item.department_name,
    active: item.active !== undefined ? item.active : 1,
  }),

  projects: (item) => ({
    _id: item.name,
    type: 'project',
    id: item.name,
    name: item.title || item.project_name,
    label: item.title || item.project_name,
    value: item.name,
    description: item.description || item.title || item.project_name,
    start_date: item.start_date,
    end_date: item.end_date,
    active: item.active !== undefined ? item.active : item.is_active || 1,
  }),

  regions: (item) => ({
    _id: item.name,
    type: 'administrative_level',
    administrative_id: item.name,
    name: item.region_name,
    administrative_level: item.administrative_level,
    parent_id: item.parent_region,
    latitude: item.latitude,
    longitude: item.longitude,
    project: item.project,
  }),
};

class LookupDataManager {
  constructor() {
    this.cache = new Map();
    this.isInitialized = false;
    this.isOnline = true;
    this.syncInProgress = false;
    this.credentials = null;
  }

  /**
   * Initialize the lookup data manager
   */
  async initialize(credentials = null, projectId = null) {
    try {
      console.log('🔄 LookupDataManager: Initializing...');

      if (credentials) {
        console.log('🔄 LookupDataManager: Credentials provided, attempting immediate sync...');
        this.credentials = credentials;

        try {
          await this.syncAllData(projectId);
          console.log('✅ LookupDataManager: Initial sync completed successfully');
        } catch (error) {
          console.warn('⚠️ Initial sync failed during initialization:', error.message);
        }
      }

      // Validate cache version
      await this.validateCacheVersion();

      // Load cached data
      await this.loadAllFromCache();

      this.isInitialized = true;
      console.log('✅ LookupDataManager initialized');

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
   * Validate cache version
   */
  async validateCacheVersion() {
    try {
      const cachedVersion = await AsyncStorage.getItem(STORAGE_KEYS.CACHE_VERSION);
      if (cachedVersion !== CACHE_VERSION) {
        console.log('🔄 Cache version mismatch, clearing cache...');
        await this.clearAllCache();
        await AsyncStorage.setItem(STORAGE_KEYS.CACHE_VERSION, CACHE_VERSION);
      }
    } catch (error) {
      console.error('❌ Error validating cache version:', error);
    }
  }

  /**
   * Load all data from cache
   */
  async loadAllFromCache() {
    try {
      const dataTypes = [
        'categories',
        'types',
        'statuses',
        'age_groups',
        'citizen_groups',
        'departments',
        'projects',
        'regions',
      ];

      for (const dataType of dataTypes) {
        const cacheKey = `${dataType}_all`;
        const storageKey = this.getStorageKey(cacheKey);

        if (storageKey) {
          try {
            const cachedData = await AsyncStorage.getItem(storageKey);
            if (cachedData) {
              const data = JSON.parse(cachedData);
              this.cache.set(cacheKey, data);
            }
          } catch (error) {
            console.error(`❌ Error loading ${dataType} from cache:`, error);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error loading data from cache:', error);
    }
  }

  /**
   * Generic data getter with caching
   */
  async getData(dataType, projectId = null, forceRefresh = false) {
    try {
      const cacheKey = projectId ? `${dataType}_${projectId}` : `${dataType}_all`;

      // Return cached data if available and not forcing refresh
      if (!forceRefresh && this.cache.has(cacheKey)) {
        const cachedData = this.cache.get(cacheKey);
        console.log(
          `📱 [${dataType.toUpperCase()}] Returning ${cachedData.length} items from cache`
        );
        return cachedData;
      }

      // Try to get from DataManager (which handles API and WatermelonDB)
      let data = [];

      switch (dataType) {
        case 'categories':
          data = await dataManager.getIssueCategories(projectId);
          break;
        case 'types':
          data = await dataManager.getIssueTypes(projectId);
          break;
        case 'statuses':
          data = await dataManager.getIssueStatuses();
          break;
        case 'age_groups':
          data = await dataManager.getAgeGroups();
          break;
        case 'citizen_groups':
          data = await dataManager.getCitizenGroups();
          break;
        case 'departments':
          data = await dataManager.getDepartments();
          break;
        case 'projects':
          data = await dataManager.getProjects();
          break;
        case 'regions':
          data = await dataManager.getAdministrativeRegions({ project: projectId });
          break;
        default:
          console.warn(`Unknown data type: ${dataType}`);
          return [];
      }

      // Cache the data
      if (data.length > 0) {
        this.cache.set(cacheKey, data);
        await this.cacheData(cacheKey, data);
        console.log(`✅ [${dataType.toUpperCase()}] Loaded ${data.length} items`);
      } else {
        console.log(`📱 [${dataType.toUpperCase()}] Fallback: ${data.length} items`);
      }

      return data;
    } catch (error) {
      console.warn(`⚠️ [${dataType.toUpperCase()}] API error:`, error.message);

      // Fallback to cached data
      const cacheKey = projectId ? `${dataType}_${projectId}` : `${dataType}_all`;
      if (this.cache.has(cacheKey)) {
        const cachedData = this.cache.get(cacheKey);
        console.log(`📱 [${dataType.toUpperCase()}] Fallback: ${cachedData.length} items`);
        return cachedData;
      }

      console.log(`📱 [${dataType.toUpperCase()}] Fallback: 0 items`);
      return [];
    }
  }

  /**
   * Fetch data from API through DataManager
   */
  async fetchFromAPI(dataType, projectId = null) {
    try {
      return await this.getData(dataType, projectId, true);
    } catch (error) {
      console.error(`❌ Error fetching ${dataType} from API:`, error);
      return [];
    }
  }

  /**
   * Transform API data using transformers
   */
  transformAPIData(dataType, rawData) {
    try {
      const transformer = DATA_TRANSFORMERS[dataType];
      if (!transformer) {
        console.warn(`No transformer found for ${dataType}`);
        return rawData;
      }

      return rawData.map(transformer);
    } catch (error) {
      console.error(`❌ Error transforming ${dataType} data:`, error);
      return rawData;
    }
  }

  /**
   * Cache data to persistent storage
   */
  async cacheData(cacheKey, data) {
    try {
      // Store in memory cache
      this.cache.set(cacheKey, data);

      // Store in persistent storage
      const storageKey = this.getStorageKey(cacheKey);
      if (storageKey) {
        try {
          await AsyncStorage.setItem(storageKey, JSON.stringify(data));
        } catch (error) {
          console.error(`❌ Error caching ${cacheKey}:`, error);
        }
      }
    } catch (error) {
      console.error(`❌ Error caching data for ${cacheKey}:`, error);
    }
  }

  /**
   * Get storage key from cache key
   */
  getStorageKey(cacheKey) {
    const keyMap = {
      categories_all: STORAGE_KEYS.CATEGORIES,
      types_all: STORAGE_KEYS.TYPES,
      statuses_all: STORAGE_KEYS.STATUSES,
      age_groups_all: STORAGE_KEYS.AGE_GROUPS,
      citizen_groups_all: STORAGE_KEYS.CITIZEN_GROUPS,
      departments_all: STORAGE_KEYS.DEPARTMENTS,
      projects_all: STORAGE_KEYS.PROJECTS,
      regions_all: STORAGE_KEYS.REGIONS,
    };
    return keyMap[cacheKey];
  }

  // Specific data getter methods
  async getCategories(projectId = null, forceRefresh = false) {
    return await this.getData('categories', projectId, forceRefresh);
  }

  async getTypes(projectId = null, forceRefresh = false) {
    return await this.getData('types', projectId, forceRefresh);
  }

  async getStatuses(forceRefresh = false) {
    return await this.getData('statuses', null, forceRefresh);
  }

  async getAgeGroups(forceRefresh = false) {
    return await this.getData('age_groups', null, forceRefresh);
  }

  async getCitizenGroups(forceRefresh = false) {
    return await this.getData('citizen_groups', null, forceRefresh);
  }

  async getDepartments(forceRefresh = false) {
    return await this.getData('departments', null, forceRefresh);
  }

  async getProjects(forceRefresh = false) {
    return await this.getData('projects', null, forceRefresh);
  }

  async getRegions(filters = {}, forceRefresh = false) {
    const projectId = filters.project;
    return await this.getData('regions', projectId, forceRefresh);
  }

  /**
   * Sync all data
   */
  async syncAllData(projectId = null) {
    if (this.syncInProgress) {
      console.log('⚠️ Sync already in progress, skipping...');
      return;
    }

    try {
      this.syncInProgress = true;
      console.log('🔄 Starting lookup data sync...');

      const dataTypes = ['statuses', 'age_groups', 'citizen_groups', 'departments', 'projects'];
      const projectSpecificTypes = ['categories', 'types', 'regions'];

      // Sync general data
      for (const dataType of dataTypes) {
        try {
          await this.syncDataType(dataType);
        } catch (error) {
          console.warn(`⚠️ Failed to sync ${dataType}:`, error.message);
        }
      }

      // Sync project-specific data if projectId is provided
      if (projectId) {
        for (const dataType of projectSpecificTypes) {
          try {
            await this.syncDataType(dataType, projectId);
          } catch (error) {
            console.warn(`⚠️ Failed to sync ${dataType} for project ${projectId}:`, error.message);
          }
        }
      }

      await this.updateSyncTimestamp();
      console.log('✅ Lookup data sync completed');
    } catch (error) {
      console.error('❌ Error during lookup data sync:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync specific data type
   */
  async syncDataType(dataType, projectId = null) {
    try {
      console.log(`🔄 Syncing ${dataType}${projectId ? ` for project ${projectId}` : ''}...`);
      await this.getData(dataType, projectId, true); // Force refresh
      console.log(`✅ ${dataType} sync completed`);
    } catch (error) {
      console.error(`❌ Error syncing ${dataType}:`, error);
      throw error;
    }
  }

  /**
   * Perform background sync
   */
  async performBackgroundSync(projectId = null) {
    try {
      if (!this.isOnline) {
        console.log('⚠️ Offline, skipping background sync');
        return;
      }

      console.log('🔄 Performing background lookup data sync...');
      await this.syncAllData(projectId);
      console.log('✅ Background sync completed');
    } catch (error) {
      console.warn('⚠️ Background sync failed:', error.message);
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
   * Check if data needs refresh
   */
  async needsRefresh(maxAgeHours = 24) {
    try {
      const lastSync = await this.getLastSyncTimestamp();
      if (!lastSync) return true;

      const lastSyncDate = new Date(lastSync);
      const now = new Date();
      const hoursDiff = (now - lastSyncDate) / (1000 * 60 * 60);

      return hoursDiff > maxAgeHours;
    } catch (error) {
      console.error('❌ Error checking refresh need:', error);
      return true;
    }
  }

  /**
   * Set online status
   */
  setOnlineStatus(isOnline) {
    this.isOnline = isOnline;
  }

  /**
   * Clear specific data type
   */
  async clearDataType(dataType) {
    try {
      const cacheKey = `${dataType}_all`;

      // Clear from memory cache
      this.cache.delete(cacheKey);

      // Clear from persistent storage
      const storageKey = this.getStorageKey(cacheKey);
      if (storageKey) {
        await AsyncStorage.removeItem(storageKey);
      }

      console.log(`✅ Cleared ${dataType} cache`);
    } catch (error) {
      console.error(`❌ Error clearing ${dataType} cache:`, error);
    }
  }

  /**
   * Clear all cache
   */
  async clearAllCache() {
    try {
      console.log('🗑️ Clearing all lookup data cache...');

      // Clear memory cache
      this.cache.clear();

      // Clear persistent storage
      const storageKeys = Object.values(STORAGE_KEYS);
      await Promise.all(storageKeys.map((key) => AsyncStorage.removeItem(key)));

      console.log('✅ All lookup data cache cleared');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const stats = {
      memoryCache: this.cache.size,
      dataTypes: Array.from(this.cache.keys()),
      isInitialized: this.isInitialized,
      syncInProgress: this.syncInProgress,
    };

    // Add count for each data type
    for (const [key, data] of this.cache.entries()) {
      stats[key] = Array.isArray(data) ? data.length : 0;
    }

    return stats;
  }

  /**
   * Force refresh all data
   */
  async forceRefreshAll(projectId = null) {
    try {
      console.log('🔄 Force refreshing all lookup data...');
      await this.clearAllCache();
      await this.syncAllData(projectId);
      console.log('✅ Force refresh completed');
    } catch (error) {
      console.error('❌ Error during force refresh:', error);
      throw error;
    }
  }

  /**
   * Get cached count for data type
   */
  getCachedCount(dataType, projectId = null) {
    const cacheKey = projectId ? `${dataType}_${projectId}` : `${dataType}_all`;
    const data = this.cache.get(cacheKey);
    return Array.isArray(data) ? data.length : 0;
  }

  /**
   * Check if data is available
   */
  async isDataAvailable(dataType, projectId = null) {
    try {
      const data = await this.getData(dataType, projectId);
      return data && data.length > 0;
    } catch (error) {
      console.error(`❌ Error checking ${dataType} availability:`, error);
      return false;
    }
  }

  /**
   * Batch update multiple data types
   */
  async batchUpdate(dataTypes = [], projectId = null) {
    try {
      console.log(`🔄 Batch updating: ${dataTypes.join(', ')}`);

      const promises = dataTypes.map((dataType) => this.syncDataType(dataType, projectId));
      await Promise.all(promises);

      console.log('✅ Batch update completed');
    } catch (error) {
      console.error('❌ Error during batch update:', error);
      throw error;
    }
  }

  /**
   * Get all lookup data
   */
  getLookupData() {
    const data = {};

    for (const [key, value] of this.cache.entries()) {
      if (key.endsWith('_all')) {
        const dataType = key.replace('_all', '');
        data[dataType] = value;
      }
    }

    return data;
  }

  /**
   * Force refresh
   */
  async forceRefresh(projectId = null) {
    try {
      console.log('🔄 Force refreshing lookup data...');
      await this.syncAllData(projectId);
      console.log('✅ Force refresh completed');
    } catch (error) {
      console.error('❌ Error during force refresh:', error);
      throw error;
    }
  }

  /**
   * Clear all data
   */
  async clearAllData() {
    await this.clearAllCache();
  }
}

// Create singleton instance
const lookupDataManager = new LookupDataManager();

export default lookupDataManager;

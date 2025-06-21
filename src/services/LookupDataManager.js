import AsyncStorage from '@react-native-async-storage/async-storage';
import frappeSyncManager from './FrappeSyncManager';

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

/**
 * API endpoint configuration
 */
const API_ENDPOINTS = {
  categories: 'egrm.api.lookup.categories',
  types: 'egrm.api.lookup.types',
  statuses: 'egrm.api.lookup.statuses',
  age_groups: 'egrm.api.lookup.age_groups',
  citizen_groups: 'egrm.api.lookup.citizen_groups',
  departments: 'egrm.api.lookup.departments',
  projects: 'egrm.api.lookup.projects',
  regions: 'egrm.api.lookup.regions',
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
  async initialize(credentials = null) {
    if (this.isInitialized) return;

    try {
      await this.validateCacheVersion();
      await this.loadAllFromCache();

      // Store credentials if provided
      if (credentials) {
        this.credentials = credentials;

        // Try to sync data immediately if we have credentials and are online
        if (this.isOnline) {
          console.log('🔄 LookupDataManager: Credentials provided, attempting immediate sync...');
          try {
            // Set credentials in FrappeSyncManager for API calls
            await frappeSyncManager.setCredentials(credentials);

            // Perform sync to get fresh data
            await this.syncAllData();
          } catch (syncError) {
            console.warn('⚠️ Initial sync failed during initialization:', syncError.message);
            // Continue with cached data
          }
        }
      }

      this.isInitialized = true;
      console.log('✅ LookupDataManager initialized');
    } catch (error) {
      console.error('❌ Error initializing LookupDataManager:', error);
      // Mark as initialized anyway to allow app to continue
      this.isInitialized = true;
    }
  }

  /**
   * Validate cache version and clear if outdated
   */
  async validateCacheVersion() {
    const cachedVersion = await AsyncStorage.getItem(STORAGE_KEYS.CACHE_VERSION);

    if (cachedVersion !== CACHE_VERSION) {
      console.log('🔄 Cache version mismatch, clearing old data...');
      await this.clearAllCache();
      await AsyncStorage.setItem(STORAGE_KEYS.CACHE_VERSION, CACHE_VERSION);
    }
  }

  /**
   * Load all lookup data from cache into memory
   */
  async loadAllFromCache() {
    const loadPromises = Object.keys(STORAGE_KEYS)
      .filter((key) => !['SYNC_TIMESTAMP', 'CACHE_VERSION'].includes(key))
      .map(async (key) => {
        const storageKey = STORAGE_KEYS[key];
        const dataType = key.toLowerCase();

        try {
          const cachedData = await AsyncStorage.getItem(storageKey);
          if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            this.cache.set(dataType, parsedData);
            console.log(`📱 Loaded ${parsedData.length} ${dataType} from cache`);
          }
        } catch (error) {
          console.error(`❌ Error loading ${dataType} from cache:`, error);
        }
      });

    await Promise.all(loadPromises);
  }

  /**
   * Generic method to fetch data from API or cache
   */
  async getData(dataType, projectId = null, forceRefresh = false) {
    const cacheKey = projectId ? `${dataType}_${projectId}` : dataType;

    // Return cached data if available and not forcing refresh
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cachedData = this.cache.get(cacheKey);
      console.log(`📱 [${dataType.toUpperCase()}] Returning ${cachedData.length} items from cache`);
      return cachedData;
    }

    // Try to fetch from API if online
    if (this.isOnline) {
      try {
        const apiData = await this.fetchFromAPI(dataType, projectId);
        if (apiData && apiData.length > 0) {
          await this.cacheData(cacheKey, apiData);
          console.log(`✅ [${dataType.toUpperCase()}] Fetched ${apiData.length} items from API`);
          return apiData;
        }
      } catch (error) {
        console.warn(`⚠️ [${dataType.toUpperCase()}] API error:`, error.message);
      }
    }

    // Fallback to cached data or empty array
    let fallbackData = this.cache.get(cacheKey);
    if (!fallbackData || fallbackData.length === 0) {
      // Try to load from persistent storage
      const storageKey = this.getStorageKey(cacheKey);
      if (storageKey) {
        try {
          const storedData = await AsyncStorage.getItem(storageKey);
          if (storedData) {
            fallbackData = JSON.parse(storedData);
            this.cache.set(cacheKey, fallbackData);
            console.log(
              `📱 [${dataType.toUpperCase()}] Fallback from persistent storage: ${
                fallbackData.length
              } items`
            );
          }
        } catch (err) {
          console.error(`❌ Error loading fallback data for ${dataType} from storage:`, err);
        }
      }
    }
    fallbackData = fallbackData || [];
    console.log(`📱 [${dataType.toUpperCase()}] Fallback: ${fallbackData.length} items`);
    return fallbackData;
  }

  /**
   * Fetch data from API with transformation
   */
  async fetchFromAPI(dataType, projectId = null) {
    const endpoint = API_ENDPOINTS[dataType];
    if (!endpoint) {
      throw new Error(`Unknown data type: ${dataType}`);
    }

    // Check if we have credentials or if FrappeSyncManager is ready
    if (!this.credentials) {
      throw new Error('No credentials available for API calls');
    }

    const params = {};
    if (projectId) params.project_id = projectId;

    try {
      const call = frappeSyncManager.getCall();
      const rawResponse = await call.get(endpoint, params);
      const response = extractApiResponse(rawResponse);

      if (response.status !== 'success') {
        throw new Error(response.message || 'API call failed');
      }

      return this.transformAPIData(dataType, response.data);
    } catch (error) {
      console.error(`❌ API call failed for ${dataType}:`, error.message);
      throw error;
    }
  }

  /**
   * Transform API data using configured transformers
   */
  transformAPIData(dataType, rawData) {
    const transformer = DATA_TRANSFORMERS[dataType];
    if (!transformer) {
      console.warn(`⚠️ No transformer found for ${dataType}, using raw data`);
      return rawData;
    }

    // Handle special case for citizen groups (nested structure)
    if (dataType === 'citizen_groups') {
      let allGroups = [];

      // Handle nested structure from API
      if (rawData.citizen_group_1 || rawData.citizen_group_2) {
        allGroups = [
          ...(rawData.citizen_group_1 || []).map((g) => ({ ...g, group_type: '1' })),
          ...(rawData.citizen_group_2 || []).map((g) => ({ ...g, group_type: '2' })),
        ];
      }
      // Handle flat array structure from cache
      else if (Array.isArray(rawData)) {
        allGroups = rawData.map((g) => ({
          ...g,
          group_type: g.group_type ? g.group_type.toString() : '1',
        }));
      }
      // Handle single item
      else {
        allGroups = [
          {
            ...rawData,
            group_type: rawData.group_type ? rawData.group_type.toString() : '1',
          },
        ];
      }

      // Sort by order if available
      const transformed = allGroups.map(transformer);
      return transformed.sort((a, b) => a.order - b.order);
    }

    // Handle age groups special case
    if (dataType === 'age_groups') {
      let items = Array.isArray(rawData) ? rawData : [rawData];
      return items.map(transformer);
    }

    // Handle array data
    if (Array.isArray(rawData)) {
      return rawData.map(transformer);
    }

    // Handle single item
    return [transformer(rawData)];
  }

  /**
   * Cache data in both memory and persistent storage
   */
  async cacheData(cacheKey, data) {
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
  }

  /**
   * Get storage key from cache key
   */
  getStorageKey(cacheKey) {
    const baseKey = cacheKey.split('_')[0].toUpperCase();
    return STORAGE_KEYS[baseKey];
  }

  /**
   * Specific data getter methods
   */
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
   * Sync methods
   */
  async syncAllData(projectId = null) {
    if (this.syncInProgress) {
      console.log('⚠️ Sync already in progress');
      return;
    }

    this.syncInProgress = true;

    try {
      console.log('🔄 Starting lookup data sync...');

      const syncPromises = [
        this.syncDataType('categories', projectId),
        this.syncDataType('types', projectId),
        this.syncDataType('statuses'),
        this.syncDataType('age_groups'),
        this.syncDataType('citizen_groups'),
        this.syncDataType('departments'),
        this.syncDataType('projects'),
        this.syncDataType('regions', projectId),
      ];

      await Promise.allSettled(syncPromises);
      await this.updateSyncTimestamp();

      console.log('✅ Lookup data sync completed');
    } catch (error) {
      console.error('❌ Error during lookup data sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync specific data type
   */
  async syncDataType(dataType, projectId = null) {
    try {
      const data = await this.fetchFromAPI(dataType, projectId);
      const cacheKey = projectId ? `${dataType}_${projectId}` : dataType;
      await this.cacheData(cacheKey, data);
      console.log(`✅ Synced ${dataType}: ${data.length} items`);
    } catch (error) {
      console.warn(`⚠️ Failed to sync ${dataType}:`, error.message);
    }
  }

  /**
   * Background sync without blocking UI
   */
  async performBackgroundSync(projectId = null) {
    // Use setTimeout to avoid blocking the UI thread
    setTimeout(async () => {
      try {
        await this.syncAllData(projectId);
      } catch (error) {
        console.error('❌ Background sync failed:', error);
      }
    }, 100);
  }

  /**
   * Update sync timestamp
   */
  async updateSyncTimestamp() {
    const timestamp = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_TIMESTAMP, timestamp);
  }

  /**
   * Get last sync timestamp
   */
  async getLastSyncTimestamp() {
    return await AsyncStorage.getItem(STORAGE_KEYS.SYNC_TIMESTAMP);
  }

  /**
   * Check if data needs refresh
   */
  async needsRefresh(maxAgeHours = 24) {
    const lastSync = await this.getLastSyncTimestamp();

    if (!lastSync) return true;

    const lastSyncDate = new Date(lastSync);
    const now = new Date();
    const hoursDiff = (now - lastSyncDate) / (1000 * 60 * 60);

    return hoursDiff > maxAgeHours;
  }

  /**
   * Set online status
   */
  setOnlineStatus(isOnline) {
    this.isOnline = isOnline;
  }

  /**
   * Clear specific data type from cache
   */
  async clearDataType(dataType) {
    const cacheKeys = Array.from(this.cache.keys()).filter((key) => key.startsWith(dataType));

    for (const key of cacheKeys) {
      this.cache.delete(key);

      const storageKey = this.getStorageKey(key);
      if (storageKey) {
        await AsyncStorage.removeItem(storageKey);
      }
    }

    console.log(`🗑️ Cleared ${dataType} from cache`);
  }

  /**
   * Clear all cached data
   */
  async clearAllCache() {
    this.cache.clear();

    const clearPromises = Object.values(STORAGE_KEYS).map((key) => AsyncStorage.removeItem(key));

    await Promise.allSettled(clearPromises);
    console.log('🗑️ All lookup data cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const stats = {};

    for (const [key, data] of this.cache.entries()) {
      stats[key] = {
        count: Array.isArray(data) ? data.length : 1,
        size: JSON.stringify(data).length,
      };
    }

    return stats;
  }

  /**
   * Force refresh all data
   */
  async forceRefreshAll(projectId = null) {
    console.log('🔄 Force refreshing all lookup data...');

    await this.clearAllCache();
    await this.syncAllData(projectId);

    console.log('✅ Force refresh completed');
  }

  /**
   * Get cached data count for a specific type
   */
  getCachedCount(dataType, projectId = null) {
    const cacheKey = projectId ? `${dataType}_${projectId}` : dataType;
    const data = this.cache.get(cacheKey);
    return data ? data.length : 0;
  }

  /**
   * Check if data is available (cached or can be fetched)
   */
  async isDataAvailable(dataType, projectId = null) {
    const cacheKey = projectId ? `${dataType}_${projectId}` : dataType;

    // Check memory cache first
    if (this.cache.has(cacheKey)) {
      return true;
    }

    // Check persistent storage
    const storageKey = this.getStorageKey(cacheKey);
    if (storageKey) {
      const stored = await AsyncStorage.getItem(storageKey);
      return !!stored;
    }

    return false;
  }

  /**
   * Batch update multiple data types
   */
  async batchUpdate(dataTypes = [], projectId = null) {
    console.log(`🔄 Batch updating: ${dataTypes.join(', ')}`);

    const updatePromises = dataTypes.map((dataType) => this.syncDataType(dataType, projectId));

    await Promise.allSettled(updatePromises);
    console.log('✅ Batch update completed');
  }

  /**
   * Get current lookup data from memory cache
   */
  getLookupData() {
    return {
      categories: this.cache.get('categories') || [],
      types: this.cache.get('types') || [],
      statuses: this.cache.get('statuses') || [],
      regions: this.cache.get('regions') || [],
      ageGroups: this.cache.get('age_groups') || [],
      citizenGroups: this.cache.get('citizen_groups') || [],
      departments: this.cache.get('departments') || [],
      projects: this.cache.get('projects') || [],
    };
  }

  /**
   * Force refresh all data (alias for forceRefreshAll)
   */
  async forceRefresh(projectId = null) {
    await this.forceRefreshAll(projectId);
    return this.getLookupData();
  }

  /**
   * Clear all data (alias for clearAllCache)
   */
  async clearAllData() {
    await this.clearAllCache();
  }
}

// Create singleton instance
const lookupDataManager = new LookupDataManager();

export default lookupDataManager;

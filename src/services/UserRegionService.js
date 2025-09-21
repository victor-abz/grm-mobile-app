import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import watermelonManager from '../database/watermelonManager';
import { logger } from '../utils/logger';

// Storage keys for user region data
const STORAGE_KEYS = {
  USER_REGIONS: 'user_regions',
  REGION_HIERARCHY: 'region_hierarchy',
  USER_LOCATION: 'user_location',
  LAST_FETCH_TIME: 'regions_last_fetch',
};

/**
 * User Region Service - Sync-First Approach
 *
 * Manages user-assigned regions using WatermelonDB sync as the single source.
 * Fetches user assignments from backend and builds region hierarchy locally.
 */
class UserRegionService {
  constructor() {
    this.syncManager = null;
    this.cachedRegions = null;
    this.lastFetchTime = null;
    this.credentials = null;
    this.isInitialized = false;
    this.currentLocation = null;

    // Legacy properties for compatibility
    this.userRegions = [];
    this.regionHierarchy = [];
  }

  /**
   * Initialize with credentials (DataProvider compatibility)
   */
  async initialize(credentials, _userProject = null) {
    logger.info('UserRegionService: Initializing with credentials', {
      hasCredentials: !!credentials,
    });

    try {
      this.credentials = credentials;

      // Get sync manager from DataManager
      const { default: dataManager } = await import('./DataManager');
      this.syncManager = dataManager.syncManager;

      if (this.syncManager) {
        logger.info('UserRegionService: Sync manager obtained from DataManager');
      } else {
        logger.warn('UserRegionService: No sync manager available - offline mode only');
      }

      // Load cached data first
      await this.loadCachedData();

      // Fetch fresh data if we have sync capability
      if (credentials && this.syncManager) {
        logger.info('UserRegionService: Fetching fresh region data via sync');
        await this.fetchUserAssignedRegions();
      } else {
        logger.info('UserRegionService: Using cached data only');
      }

      this.isInitialized = true;
      logger.info('UserRegionService: Service initialized successfully', {
        regionsCount: this.userRegions.length,
        hierarchyCount: this.regionHierarchy.length,
      });

      return {
        success: true,
        regionsCount: this.userRegions.length,
        hierarchyCount: this.regionHierarchy.length,
      };
    } catch (error) {
      logger.error('UserRegionService: Error initializing service', error);

      // Try to use cached data as fallback
      await this.loadCachedData();

      if (this.userRegions.length === 0) {
        return {
          success: false,
          error: 'NO_REGIONS_ASSIGNED',
          message: 'No administrative regions found. Please contact your administrator.',
        };
      }

      return {
        success: false,
        error: 'REGION_INITIALIZATION_FAILED',
        message: error.message,
      };
    }
  }

  /**
   * Load cached region data from local storage
   */
  async loadCachedData() {
    try {
      logger.info('UserRegionService: Loading cached region data');

      const [cachedRegions, cachedHierarchy, lastFetch] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER_REGIONS),
        AsyncStorage.getItem(STORAGE_KEYS.REGION_HIERARCHY),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_FETCH_TIME),
      ]);

      if (cachedRegions) {
        this.userRegions = JSON.parse(cachedRegions);
        logger.info('UserRegionService: Loaded cached user regions', {
          userRegionsCount: this.userRegions.length,
        });
      }

      if (cachedHierarchy) {
        this.regionHierarchy = JSON.parse(cachedHierarchy);
        logger.info('UserRegionService: Loaded cached hierarchy regions', {
          hierarchyRegionsCount: this.regionHierarchy.length,
        });
      }

      if (lastFetch) {
        this.lastFetchTime = parseInt(lastFetch, 10);
      }
    } catch (error) {
      logger.error('UserRegionService: Error loading cached data', error);
      this.userRegions = [];
      this.regionHierarchy = [];
    }
  }

  /**
   * Cache region data to local storage
   */
  async cacheRegionData() {
    try {
      logger.info('UserRegionService: Caching region data', {
        userRegionsCount: this.userRegions.length,
        hierarchyCount: this.regionHierarchy.length,
      });

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.USER_REGIONS, JSON.stringify(this.userRegions)),
        AsyncStorage.setItem(STORAGE_KEYS.REGION_HIERARCHY, JSON.stringify(this.regionHierarchy)),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_FETCH_TIME, this.lastFetchTime.toString()),
      ]);

      logger.info('UserRegionService: Region data cached successfully');
    } catch (error) {
      logger.error('UserRegionService: Error caching region data', error);
    }
  }

  /**
   * Fetch user assigned regions using sync-first approach
   */
  async fetchUserAssignedRegions() {
    logger.info('UserRegionService: Fetching user assigned regions');

    try {
      // Step 1: Check if we have recent cached data
      if (this.regionHierarchy.length > 0 && this.isDataFresh()) {
        console.log('📱 [USER_REGIONS] Using fresh cached regions');
        return this.regionHierarchy;
      }

      // Step 2: Trigger WatermelonDB sync if we have sync capability
      if (this.syncManager && this.credentials) {
        console.log('🔄 [USER_REGIONS] Triggering WatermelonDB sync for regions...');

        try {
          await this.syncManager.sync();
          console.log('✅ [USER_REGIONS] Sync completed, processing regions...');
        } catch (syncError) {
          console.error('❌ [USER_REGIONS] Sync failed:', syncError);
          // Continue with local data
        }
      }

      // Step 3: Get regions from local WatermelonDB
      console.log('📱 [USER_REGIONS] Fetching regions from local WatermelonDB...');
      const regions = await this.getRegionsFromLocalDB();
      console.log(`📱 [USER_REGIONS] Found ${regions.length} regions in local DB`);

      // Step 4: Get user context for region filtering
      const userContext = await this.getUserContext();

      // Step 5: Process regions with user assignments
      const processedRegions = this.processRegionsWithUserAssignments(regions, userContext);

      // Step 6: Build hierarchy and cache
      const hierarchicalRegions = this.buildRegionHierarchy(processedRegions);

      // Update both new and legacy properties
      this.regionHierarchy = hierarchicalRegions;
      this.userRegions = processedRegions; // Flat list for legacy compatibility
      this.lastFetchTime = Date.now();

      // Cache the data
      await this.cacheRegionData();

      logger.info('UserRegionService: Returning user-assigned regions', {
        hierarchicalRegionsCount: hierarchicalRegions.length,
      });
      return hierarchicalRegions;
    } catch (error) {
      logger.error('UserRegionService: Error fetching user assigned regions', error);
      return this.regionHierarchy || [];
    }
  }

  /**
   * Get regions from local WatermelonDB
   */
  static async getRegionsFromLocalDB() {
    try {
      const database = watermelonManager.getDatabase();
      if (!database) {
        logger.error('UserRegionService: Database not available');
        return [];
      }

      const collection = database.get('grm_administrative_regions');
      const records = await collection.query().fetch();

      // Convert to plain objects
      const regions = records.map((record) => ({
        id: record.id,
        name: record.name || record._raw.name,
        ...record._raw,
      }));

      return regions;
    } catch (error) {
      logger.error('UserRegionService: Error fetching regions from local DB', error);
      return [];
    }
  }

  /**
   * Get user context
   */
  async getUserContext() {
    try {
      const userId = this.credentials?.username || 'current_user';
      return await watermelonManager.getUserContext(userId);
    } catch (error) {
      logger.error('UserRegionService: Error getting user context', error);
      return null;
    }
  }

  /**
   * Process regions with user assignments
   */
  processRegionsWithUserAssignments(regions, userContext) {
    // For now, return all regions - user context filtering can be enhanced later
    return regions.map((region) => ({
      ...region,
      isAssigned: this.isUserAssignedToRegion(region, userContext),
      userRole: this.getUserRoleForRegion(region, userContext),
      user_assignment: {
        is_assigned: this.isUserAssignedToRegion(region, userContext),
        role: this.getUserRoleForRegion(region, userContext),
        department: this.getUserDepartmentForRegion(region, userContext),
      },
    }));
  }

  /**
   * Check if user is assigned to region
   */
  static isUserAssignedToRegion(region, userContext) {
    if (!userContext?.accessible_regions) return false;
    return userContext.accessible_regions.some(
      (accessibleRegion) => accessibleRegion.name === region.id || accessibleRegion.id === region.id
    );
  }

  /**
   * Get user role for region
   */
  static getUserRoleForRegion(region, userContext) {
    if (!userContext?.assignments) return null;
    const assignment = userContext.assignments.find(
      (assgn) => assgn.region?.id === region.id || assgn.region?.name === region.id
    );
    return assignment?.role || null;
  }

  /**
   * Get user department for region
   */
  static getUserDepartmentForRegion(region, userContext) {
    if (!userContext?.assignments) return null;
    const assignment = userContext.assignments.find(
      (assgn) => assgn.region?.id === region.id || assgn.region?.name === region.id
    );
    return assignment?.department || null;
  }

  /**
   * Build region hierarchy
   */
  static buildRegionHierarchy(regions) {
    // Create a map for quick lookup
    const regionMap = new Map();
    regions.forEach((region) => {
      regionMap.set(region.id, { ...region, children: [] });
    });

    const rootRegions = [];

    // Build hierarchy
    regions.forEach((region) => {
      const regionNode = regionMap.get(region.id);
      const parentId = region.parent_region;

      if (parentId && regionMap.has(parentId)) {
        // Has parent - add to parent's children
        const parent = regionMap.get(parentId);
        parent.children.push(regionNode);
      } else {
        // No parent or parent not found - add to root
        rootRegions.push(regionNode);
      }
    });

    return rootRegions;
  }

  /**
   * Check if cached data is fresh (less than 5 minutes old)
   */
  static isDataFresh() {
    if (!this.lastFetchTime) return false;
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() - this.lastFetchTime < fiveMinutes;
  }

  /**
   * Clear cache to force refresh
   */
  async clearCache() {
    console.log('🧹 [USER_REGIONS] Clearing region cache...');

    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.USER_REGIONS),
        AsyncStorage.removeItem(STORAGE_KEYS.REGION_HIERARCHY),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_FETCH_TIME),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_LOCATION),
      ]);

      this.lastFetchTime = null;
      this.userRegions = [];
      this.regionHierarchy = [];
      this.currentLocation = null;

      console.log('✅ [USER_REGIONS] Cache cleared successfully');
    } catch (error) {
      console.error('❌ [USER_REGIONS] Error clearing cache:', error);
    }
  }

  /**
   * Force refresh regions
   */
  async refreshRegions() {
    console.log('🔄 [USER_REGIONS] Force refreshing regions...');

    try {
      await this.clearCache();
      await this.fetchUserAssignedRegions();

      return {
        success: true,
        regionsCount: this.userRegions.length,
      };
    } catch (error) {
      console.error('❌ [USER_REGIONS] Error refreshing regions:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * COMPATIBILITY METHODS - Maintain compatibility with existing code
   */

  /**
   * Get accessible regions (returns the cached hierarchy)
   */
  getAccessibleRegions() {
    console.log(
      `📱 [USER_REGIONS] Getting accessible regions: ${this.regionHierarchy?.length || 0} available`
    );
    return this.regionHierarchy || [];
  }

  /**
   * Get assigned regions (flattened list of all regions with assignments)
   */
  getAssignedRegions() {
    console.log('📱 [USER_REGIONS] Getting assigned regions...');
    return this.userRegions || [];
  }

  /**
   * Get regions by administrative level
   */
  getRegionsByLevel(level) {
    const flattenRegions = (regions) => {
      let flattened = [];
      regions.forEach((region) => {
        flattened.push(region);
        if (region.children && region.children.length > 0) {
          flattened = flattened.concat(flattenRegions(region.children));
        }
      });
      return flattened;
    };

    const allRegions = flattenRegions(this.regionHierarchy || []);
    return allRegions.filter(
      (region) =>
        region.administrative_level === level ||
        region.level === level ||
        region.admin_level === level
    );
  }

  /**
   * Get children of a specific region
   */
  getRegionChildren(parentId) {
    const findRegionRecursive = (regions) => {
      for (const region of regions) {
        if (region.id === parentId) {
          return region.children || [];
        }
        if (region.children) {
          const found = findRegionRecursive(region.children);
          if (found.length > 0) return found;
        }
      }
      return [];
    };

    return findRegionRecursive(this.regionHierarchy || []);
  }

  /**
   * Get top-level regions (root nodes of hierarchy)
   */
  getTopLevelRegions() {
    return this.regionHierarchy || [];
  }

  /**
   * Check if user has access to a specific region
   */
  hasAccessToRegion(regionId) {
    return this.userRegions.some((region) => region.id === regionId && region.isAssigned);
  }

  /**
   * Find nearest region to user location
   */
  findNearestRegion(userLocation = null) {
    const location = userLocation || this.currentLocation;
    if (!location) {
      return null;
    }

    // Simple implementation - return first accessible region
    const accessibleRegions = this.userRegions.filter((region) => region.isAssigned);
    return accessibleRegions.length > 0 ? accessibleRegions[0] : null;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasCredentials: !!this.credentials,
      regionsCount: this.userRegions.length,
      hierarchyCount: this.regionHierarchy.length,
      hasCurrentLocation: !!this.currentLocation,
      lastFetchTime: this.lastFetchTime,
      dataFreshness: this.isDataFresh() ? 'fresh' : 'stale',
    };
  }

  /**
   * LOCATION METHODS
   */

  /**
   * Request location permission
   */
  static async requestLocationPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';

      return {
        success: granted,
        status,
        message: granted ? 'Location permission granted' : 'Location permission denied',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get current location
   */
  static async getCurrentLocation() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: Date.now(),
      };

      // Cache the location
      await this.cacheLocation(this.currentLocation);

      return {
        success: true,
        location: this.currentLocation,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Cache user location
   */
  static async cacheLocation(location) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_LOCATION, JSON.stringify(location));
    } catch (error) {
      console.error('❌ [USER_REGIONS] Error caching location:', error);
    }
  }

  /**
   * Get cached location
   */
  static async getCachedLocation() {
    try {
      const cachedLocation = await AsyncStorage.getItem(STORAGE_KEYS.USER_LOCATION);
      return cachedLocation ? JSON.parse(cachedLocation) : null;
    } catch (error) {
      console.error('❌ [USER_REGIONS] Error getting cached location:', error);
      return null;
    }
  }

  /**
   * Get region by ID
   */
  async getRegionById(regionId) {
    const regions = await this.fetchUserAssignedRegions();

    // Search in flat list including children
    const findRegionRecursive = (regionList) => {
      for (const region of regionList) {
        if (region.id === regionId) {
          return region;
        }
        if (region.children) {
          const found = findRegionRecursive(region.children);
          if (found) return found;
        }
      }
      return null;
    };

    return findRegionRecursive(regions);
  }

  /**
   * Get user's accessible project IDs
   */
  async getUserAccessibleProjects() {
    const userContext = await this.getUserContext();
    return userContext?.accessible_projects || [];
  }
}

// Create and export singleton instance
const userRegionService = new UserRegionService();
export default userRegionService;

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import dataManager from './DataManager';

// Storage keys for user region data
const STORAGE_KEYS = {
  USER_REGIONS: 'user_assigned_regions',
  USER_REGION_HIERARCHY: 'user_region_hierarchy',
  LAST_REGION_SYNC: 'last_region_sync',
  USER_GEOLOCATION: 'user_geolocation',
};

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

class UserRegionService {
  constructor() {
    this.userRegions = [];
    this.regionHierarchy = [];
    this.isInitialized = false;
    this.credentials = null;
    this.userProject = null;
    this.currentLocation = null;
  }

  /**
   * Initialize the service with user credentials
   */
  async initialize(credentials, userProject = null) {
    try {
      this.credentials = credentials;
      this.userProject = userProject; // Keep for backward compatibility, but API won't need it

      // Load cached data
      await this.loadCachedData();

      // Fetch fresh data if online
      if (credentials) {
        await this.fetchUserAssignedRegions();
      }

      this.isInitialized = true;
      console.log('✅ UserRegionService initialized');

      return {
        success: true,
        regionsCount: this.userRegions.length,
        hierarchyCount: this.regionHierarchy.length,
      };
    } catch (error) {
      console.error('❌ Error initializing UserRegionService:', error);

      // If user has no regions assigned, this is a critical error
      if (error.message?.includes('no regions assigned')) {
        return {
          success: false,
          error: 'NO_REGIONS_ASSIGNED',
          message: 'User has no administrative regions assigned. Please contact administrator.',
        };
      }

      return {
        success: false,
        error: 'INITIALIZATION_FAILED',
        message: error.message,
      };
    }
  }

  /**
   * Load cached region data
   */
  async loadCachedData() {
    try {
      const [userRegions, regionHierarchy] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER_REGIONS),
        AsyncStorage.getItem(STORAGE_KEYS.USER_REGION_HIERARCHY),
      ]);

      this.userRegions = userRegions ? JSON.parse(userRegions) : [];
      this.regionHierarchy = regionHierarchy ? JSON.parse(regionHierarchy) : [];

      console.log(`📱 Loaded ${this.userRegions.length} user regions from cache`);
    } catch (error) {
      console.error('❌ Error loading cached region data:', error);
    }
  }

  /**
   * Fetch user-assigned regions from backend through DataManager
   */
  async fetchUserAssignedRegions() {
    try {
      if (!this.credentials) {
        throw new Error('No credentials available for API calls');
      }

      console.log('🔄 Fetching user-assigned regions...');

      // Use DataManager to get regions which will handle API calls and caching
      const regions = await dataManager.getAdministrativeRegions({ forceRefresh: true });

      if (!regions || regions.length === 0) {
        throw new Error(
          'User has no regions assigned. Please contact administrator to assign administrative regions.'
        );
      }

      // Transform the regions - backend now returns enhanced data automatically
      const transformedRegions = regions.map((region) => ({
        _id: region.name || region._id,
        type: 'administrative_level',
        administrative_id: region.name || region.administrative_id,
        name: region.region_name || region.name,
        administrative_level: region.administrative_level,
        parent_id: region.parent_region || region.parent_id,
        latitude: region.latitude,
        longitude: region.longitude,
        project: region.project,
        path: region.path,
        // Enhanced fields from backend
        user_role: region.user_role,
        user_department: region.user_department,
        is_directly_assigned:
          region.is_directly_assigned !== undefined ? region.is_directly_assigned : true,
        is_user_assigned:
          region.is_directly_assigned !== undefined ? region.is_directly_assigned : true, // For backward compatibility
      }));

      // Backend returns complete hierarchy, separate directly assigned vs accessible
      this.userRegions = transformedRegions.filter((region) => region.is_directly_assigned);
      this.regionHierarchy = transformedRegions;

      // Cache the data
      await this.cacheRegionData();

      console.log(`✅ Fetched ${this.userRegions.length} directly assigned regions`);
      console.log(`📊 Total accessible regions: ${this.regionHierarchy.length}`);

      // Log projects for debugging
      const projects = [...new Set(transformedRegions.map((r) => r.project))];
      console.log(`📁 User has access to projects: ${projects.join(', ')}`);

      return {
        assignedRegions: this.userRegions,
        hierarchicalRegions: this.regionHierarchy,
      };
    } catch (error) {
      console.error('❌ Error fetching user-assigned regions:', error);
      throw error;
    }
  }

  /**
   * Fetch children of a specific region (for hierarchical navigation)
   */
  async fetchRegionChildren(parentId) {
    try {
      console.log(`🔄 Fetching children for region: ${parentId}`);

      // Get all regions and filter by parent
      const allRegions = await dataManager.getAdministrativeRegions();
      const children = allRegions.filter((region) => region.parent_id === parentId);

      console.log(`✅ Found ${children.length} children for region ${parentId}`);
      return children;
    } catch (error) {
      console.error(`❌ Error fetching children for region ${parentId}:`, error);
      return [];
    }
  }

  /**
   * Build hierarchical structure from flat region data
   */
  async buildRegionHierarchy(assignedRegions) {
    // For now, just return the assigned regions
    // TODO: Implement proper hierarchy building if needed
    return assignedRegions;
  }

  /**
   * Cache region data to persistent storage
   */
  async cacheRegionData() {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.USER_REGIONS, JSON.stringify(this.userRegions)),
        AsyncStorage.setItem(
          STORAGE_KEYS.USER_REGION_HIERARCHY,
          JSON.stringify(this.regionHierarchy)
        ),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_REGION_SYNC, new Date().toISOString()),
      ]);

      console.log('✅ Region data cached successfully');
    } catch (error) {
      console.error('❌ Error caching region data:', error);
    }
  }

  /**
   * Get all accessible regions (including hierarchy)
   */
  getAccessibleRegions() {
    return this.regionHierarchy;
  }

  /**
   * Get directly assigned regions only
   */
  getAssignedRegions() {
    return this.userRegions;
  }

  /**
   * Get regions by administrative level
   */
  getRegionsByLevel(level) {
    return this.regionHierarchy.filter((region) => region.administrative_level === level);
  }

  /**
   * Get children regions for a parent
   */
  getRegionChildren(parentId) {
    return this.regionHierarchy.filter((region) => region.parent_id === parentId);
  }

  /**
   * Get top-level regions (no parent)
   */
  getTopLevelRegions() {
    return this.regionHierarchy.filter((region) => !region.parent_id);
  }

  /**
   * Check if user has access to a specific region
   */
  hasAccessToRegion(regionId) {
    return this.regionHierarchy.some(
      (region) => region.administrative_id === regionId || region._id === regionId
    );
  }

  /**
   * Request location permission
   */
  async requestLocationPermission() {
    try {
      console.log('🔄 Requesting location permission...');

      let { status } = await Location.getForegroundPermissionsAsync();

      if (status !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        status = newStatus;
      }

      if (status !== 'granted') {
        console.warn('⚠️ Location permission denied');
        return {
          success: false,
          error: 'PERMISSION_DENIED',
          message: 'Location permission is required to find nearby regions',
        };
      }

      console.log('✅ Location permission granted');
      return { success: true };
    } catch (error) {
      console.error('❌ Error requesting location permission:', error);
      return {
        success: false,
        error: 'PERMISSION_ERROR',
        message: error.message,
      };
    }
  }

  /**
   * Get current location
   */
  async getCurrentLocation() {
    try {
      console.log('🔄 Getting current location...');

      const permissionResult = await this.requestLocationPermission();
      if (!permissionResult.success) {
        return permissionResult;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000,
        maximumAge: 300000, // 5 minutes
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };

      // Cache the location
      await this.cacheLocation(this.currentLocation);

      console.log('✅ Location obtained successfully');
      return {
        success: true,
        location: this.currentLocation,
      };
    } catch (error) {
      console.error('❌ Error getting current location:', error);

      // Try to return cached location as fallback
      const cachedLocation = await this.getCachedLocation();
      if (cachedLocation) {
        console.log('📱 Using cached location as fallback');
        this.currentLocation = cachedLocation;
        return {
          success: true,
          location: cachedLocation,
          isCached: true,
        };
      }

      return {
        success: false,
        error: 'LOCATION_ERROR',
        message: error.message,
      };
    }
  }

  /**
   * Cache location data
   */
  async cacheLocation(location) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_GEOLOCATION, JSON.stringify(location));
    } catch (error) {
      console.error('❌ Error caching location:', error);
    }
  }

  /**
   * Get cached location
   */
  async getCachedLocation() {
    try {
      const cachedLocation = await AsyncStorage.getItem(STORAGE_KEYS.USER_GEOLOCATION);
      if (cachedLocation) {
        const location = JSON.parse(cachedLocation);

        // Check if cached location is not too old (1 hour)
        const now = Date.now();
        const locationAge = now - location.timestamp;
        const oneHour = 60 * 60 * 1000;

        if (locationAge < oneHour) {
          return location;
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting cached location:', error);
      return null;
    }
  }

  /**
   * Find nearest region based on user location
   */
  findNearestRegion(userLocation = null) {
    try {
      const location = userLocation || this.currentLocation;
      if (!location) {
        console.warn('⚠️ No location available for region matching');
        return null;
      }

      let nearestRegion = null;
      let shortestDistance = Infinity;

      for (const region of this.regionHierarchy) {
        if (region.latitude && region.longitude) {
          const distance = this.calculateDistance(
            location.latitude,
            location.longitude,
            region.latitude,
            region.longitude
          );

          if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestRegion = { ...region, distance };
          }
        }
      }

      if (nearestRegion) {
        console.log(`✅ Nearest region: ${nearestRegion.name} (${shortestDistance.toFixed(2)} km)`);
      } else {
        console.warn('⚠️ No regions with coordinates found');
      }

      return nearestRegion;
    } catch (error) {
      console.error('❌ Error finding nearest region:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Refresh regions from server
   */
  async refreshRegions() {
    try {
      if (!this.credentials) {
        throw new Error('No credentials available');
      }

      console.log('🔄 Refreshing regions from server...');
      await this.fetchUserAssignedRegions();
      console.log('✅ Regions refreshed successfully');

      return {
        success: true,
        regionsCount: this.userRegions.length,
        hierarchyCount: this.regionHierarchy.length,
      };
    } catch (error) {
      console.error('❌ Error refreshing regions:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Clear cached data
   */
  async clearCache() {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.USER_REGIONS),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_REGION_HIERARCHY),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_REGION_SYNC),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_GEOLOCATION),
      ]);

      this.userRegions = [];
      this.regionHierarchy = [];
      this.currentLocation = null;

      console.log('✅ UserRegionService cache cleared');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasCredentials: !!this.credentials,
      userRegionsCount: this.userRegions.length,
      hierarchyRegionsCount: this.regionHierarchy.length,
      hasCurrentLocation: !!this.currentLocation,
      currentLocation: this.currentLocation,
    };
  }
}

// Create singleton instance
const userRegionService = new UserRegionService();

export default userRegionService;

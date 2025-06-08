import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import frappeSyncManager from './FrappeSyncManager';

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
   * Fetch user-assigned regions from backend
   */
  async fetchUserAssignedRegions() {
    try {
      if (!this.credentials) {
        throw new Error('No credentials available for API calls');
      }

      const call = frappeSyncManager.getCall();

      // Simplified API call - no parameters needed, backend uses user session
      console.log('🔄 Fetching user-assigned regions...');
      const rawResponse = await call.get('egrm.api.lookup.regions');
      const response = extractApiResponse(rawResponse);

      if (response.status === 'success') {
        if (!response.data || response.data.length === 0) {
          throw new Error(
            'User has no regions assigned. Please contact administrator to assign administrative regions.'
          );
        }

        // Transform the regions - backend now returns enhanced data automatically
        const transformedRegions = response.data.map((region) => ({
          _id: region.name,
          type: 'administrative_level',
          administrative_id: region.name,
          name: region.region_name,
          administrative_level: region.administrative_level,
          parent_id: region.parent_region,
          latitude: region.latitude,
          longitude: region.longitude,
          project: region.project,
          path: region.path,
          // Enhanced fields from backend
          user_role: region.user_role,
          user_department: region.user_department,
          is_directly_assigned: region.is_directly_assigned,
          is_user_assigned: region.is_directly_assigned, // For backward compatibility
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
      } else {
        throw new Error(response.message || 'Failed to fetch user regions');
      }
    } catch (error) {
      console.error('❌ Error fetching user-assigned regions:', error);
      throw error;
    }
  }

  /**
   * Fetch children of a specific region
   */
  async fetchRegionChildren(parentId) {
    try {
      if (!this.credentials) {
        console.warn('⚠️ No credentials available for fetching region children');
        return this.getRegionChildren(parentId); // Use cached data
      }

      const call = frappeSyncManager.getCall();

      // Simplified API call - only parent_id needed, backend handles project context
      console.log(`🔄 Fetching children for region: ${parentId}`);
      const rawResponse = await call.get('egrm.api.lookup.regions', { parent_id: parentId });
      const response = extractApiResponse(rawResponse);

      if (response.status === 'success' && response.data) {
        return response.data.map((childRegion) => ({
          _id: childRegion.name,
          type: 'administrative_level',
          administrative_id: childRegion.name,
          name: childRegion.region_name,
          administrative_level: childRegion.administrative_level,
          parent_id: childRegion.parent_region,
          latitude: childRegion.latitude,
          longitude: childRegion.longitude,
          project: childRegion.project,
          path: childRegion.path,
          user_role: childRegion.user_role,
          user_department: childRegion.user_department,
          is_directly_assigned: childRegion.is_directly_assigned,
          is_user_assigned: false, // Children are accessible but not directly assigned
        }));
      }
      return [];
    } catch (error) {
      console.warn(`⚠️ Error fetching children for region ${parentId}:`, error.message);
      // Fallback to cached data
      return this.getRegionChildren(parentId);
    }
  }

  /**
   * Build complete region hierarchy including children
   * @deprecated - Backend now returns the complete hierarchy
   */
  async buildRegionHierarchy(assignedRegions) {
    console.warn('⚠️ buildRegionHierarchy is deprecated - backend now returns complete hierarchy');
    return assignedRegions;
  }

  /**
   * Cache region data
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
    } catch (error) {
      console.error('❌ Error caching region data:', error);
    }
  }

  /**
   * Get all accessible regions (hierarchical)
   */
  getAccessibleRegions() {
    return this.regionHierarchy;
  }

  /**
   * Get only directly assigned regions
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
   * Get children of a specific region
   */
  getRegionChildren(parentId) {
    return this.regionHierarchy.filter((region) => region.parent_id === parentId);
  }

  /**
   * Get top-level regions (no parent)
   */
  getTopLevelRegions() {
    return this.regionHierarchy.filter((region) => !region.parent_id || region.parent_id === null);
  }

  /**
   * Check if user has access to a specific region
   */
  hasAccessToRegion(regionId) {
    return this.regionHierarchy.some((region) => region.administrative_id === regionId);
  }

  /**
   * Request device location permission and get current location
   */
  async requestLocationPermission() {
    try {
      console.log('🔍 Requesting location permission...');

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        return {
          success: false,
          error: 'PERMISSION_DENIED',
          message: 'Location permission denied. You can still select location manually.',
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
   * Get current device location
   */
  async getCurrentLocation() {
    try {
      console.log('📍 Getting current location...');

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: new Date().toISOString(),
      };

      // Cache the location
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_GEOLOCATION,
        JSON.stringify(this.currentLocation)
      );

      console.log('✅ Current location obtained:', this.currentLocation);
      return {
        success: true,
        location: this.currentLocation,
      };
    } catch (error) {
      console.error('❌ Error getting current location:', error);
      return {
        success: false,
        error: 'LOCATION_ERROR',
        message: error.message,
      };
    }
  }

  /**
   * Get cached location
   */
  async getCachedLocation() {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.USER_GEOLOCATION);
      if (cached) {
        this.currentLocation = JSON.parse(cached);
        return {
          success: true,
          location: this.currentLocation,
          cached: true,
        };
      }
      return { success: false, message: 'No cached location found' };
    } catch (error) {
      console.error('❌ Error getting cached location:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Find nearest region to current location
   */
  findNearestRegion(userLocation = null) {
    const location = userLocation || this.currentLocation;

    if (!location) {
      return null;
    }

    let nearestRegion = null;
    let minDistance = Infinity;

    this.regionHierarchy.forEach((region) => {
      if (region.latitude && region.longitude) {
        const distance = this.calculateDistance(
          location.latitude,
          location.longitude,
          parseFloat(region.latitude),
          parseFloat(region.longitude)
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestRegion = region;
        }
      }
    });

    return nearestRegion
      ? {
          region: nearestRegion,
          distance: minDistance,
        }
      : null;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
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
    return R * c; // Distance in kilometers
  }

  /**
   * Refresh region data
   */
  async refreshRegions() {
    try {
      console.log('🔄 Refreshing user region data...');
      await this.fetchUserAssignedRegions();
      return { success: true };
    } catch (error) {
      console.error('❌ Error refreshing regions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear all cached region data
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

      console.log('🗑️ User region cache cleared');
    } catch (error) {
      console.error('❌ Error clearing region cache:', error);
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasCredentials: !!this.credentials,
      userProject: this.userProject,
      assignedRegionsCount: this.userRegions.length,
      totalAccessibleRegions: this.regionHierarchy.length,
      currentLocation: this.currentLocation,
      lastSync: null, // Could implement this
    };
  }
}

// Create singleton instance
const userRegionService = new UserRegionService();

export default userRegionService;

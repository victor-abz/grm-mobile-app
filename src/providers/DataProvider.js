import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import lookupDataManager from '../services/LookupDataManager';
import nuclearDataManager from '../services/NuclearDataManager';
import userRegionService from '../services/UserRegionService';
import { AuthContext } from './AuthProvider';
import { FRAPPE_BASE_URL } from '../utils/constants';

const DataContext = createContext({});

/**
 * Custom hook to use DataContext
 * @returns {Object} DataContext value
 */
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

function DataProvider({ children }) {
  const { isAuthenticated, credentials, userInfo, logout } = useContext(AuthContext);
  const [isDataInitialized, setIsDataInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [initializationError, setInitializationError] = useState(null);
  const [dataManager, setDataManager] = useState(null);
  const [regionError, setRegionError] = useState(null);
  const [lookupData, setLookupData] = useState({
    categories: [],
    types: [],
    statuses: [],
    regions: [],
    ageGroups: [],
    citizenGroups: [],
    departments: [],
    projects: [],
  });

  // Initialize data services when user is authenticated
  useEffect(() => {
    if (isAuthenticated && credentials && !isDataInitialized) {
      console.log('🔄 DataProvider: User authenticated, starting data services initialization');
      console.log('🔄 DataProvider: Credentials available:', credentials ? 'yes' : 'no');
      initializeDataServices();
    } else if (!isAuthenticated && isDataInitialized) {
      // User logged out, reset data
      console.log('🔄 DataProvider: User logged out, resetting data services');
      resetDataServices();
    } else if (!isAuthenticated && !credentials) {
      console.log('🔄 DataProvider: No user authentication, data services not initialized');
    }
  }, [isAuthenticated, credentials]);

  const initializeDataServices = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setInitializationError(null);
    setRegionError(null);

    try {
      console.log('🔄 Initializing data services...');

      // Check if we have valid credentials
      if (!credentials || !credentials.username || !credentials.password) {
        throw new Error('No valid credentials available. Please log in again.');
      }

      // Create enhanced credentials with URL for DataManager
      const enhancedCredentials = {
        ...credentials,
        url: FRAPPE_BASE_URL,
      };

      console.log('🔄 DataProvider: Initializing DataManager with credentials...');

      // Import DataManager dynamically and initialize with enhanced credentials
      const { default: DataManagerModule } = await import('../services/DataManager');
      try {
        await DataManagerModule.initialize(enhancedCredentials);
        setDataManager(DataManagerModule);
        console.log('✅ DataManager initialized successfully');
      } catch (authError) {
        console.error('❌ DataManager authentication failed:', authError);

        // If authentication fails, it means credentials are invalid
        if (
          authError.message.includes('Authentication') ||
          authError.message.includes('credentials') ||
          authError.message.includes('Incomplete login')
        ) {
          console.log(
            '🔄 Authentication error detected, will trigger logout after initialization...'
          );
          // Set a flag to trigger logout after this function completes
          setTimeout(() => {
            handleAuthenticationError(authError);
          }, 1000);
        } else {
          // For non-authentication errors, just set the error state
          setInitializationError({
            message: 'Failed to initialize backend connection.',
            details: 'The app will continue in offline mode.',
            requiresLogin: false,
          });
        }

        // Don't throw here, continue with offline initialization
        console.log('🔄 Continuing with offline initialization...');
      }

      // Initialize LookupDataManager
      await lookupDataManager.initialize(enhancedCredentials);

      // Initialize UserRegionService - simplified, no project needed
      // Backend automatically determines user's projects from their assignments
      const regionResult = await userRegionService.initialize(enhancedCredentials);

      if (!regionResult.success) {
        if (regionResult.error === 'NO_REGIONS_ASSIGNED') {
          setRegionError({
            type: 'NO_REGIONS_ASSIGNED',
            message: regionResult.message,
            title: 'No Administrative Regions Assigned',
            action:
              'Please contact your administrator to assign administrative regions to your account.',
          });
          console.error('❌ User has no regions assigned');
        } else {
          setRegionError({
            type: 'REGION_INITIALIZATION_FAILED',
            message: regionResult.message,
            title: 'Region Service Initialization Failed',
            action: 'Please try refreshing or contact support if the problem persists.',
          });
          console.error('❌ Region service initialization failed');
        }
      } else {
        console.log(
          `✅ Region service initialized with ${regionResult.regionsCount} assigned regions`
        );
      }

      // Load lookup data
      // await loadLookupData();

      setIsDataInitialized(true);
      console.log('✅ All data services initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing data services:', error);
      setInitializationError({
        message: error.message,
        details: 'Failed to initialize data services. Please try logging in again.',
        requiresLogin:
          error.message.includes('credentials') || error.message.includes('Authentication'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetDataServices = async () => {
    console.log('🔄 Resetting data services...');

    setIsDataInitialized(false);
    setDataManager(null);
    setRegionError(null);
    setInitializationError(null);

    // Clear region service cache
    await userRegionService.clearCache();

    // Reset lookup data
    setLookupData({
      categories: [],
      types: [],
      statuses: [],
      regions: [],
      ageGroups: [],
      citizenGroups: [],
      departments: [],
      projects: [],
    });

    console.log('✅ Data services reset');
  };

  const loadLookupData = async () => {
    try {
      console.log('🔄 Loading lookup data...');

      // Get user's accessible regions from UserRegionService
      const userRegions = userRegionService.getAccessibleRegions();

      // Load other lookup data with error handling for each type
      const results = await Promise.allSettled([
        lookupDataManager.getCategories(),
        lookupDataManager.getTypes(),
        lookupDataManager.getStatuses(),
        lookupDataManager.getAgeGroups(),
        lookupDataManager.getCitizenGroups(),
        lookupDataManager.getDepartments(),
        lookupDataManager.getProjects(),
      ]);

      // Process results, using empty arrays for rejected promises
      const [
        categories = [],
        types = [],
        statuses = [],
        ageGroups = [],
        citizenGroups = [],
        departments = [],
        projects = [],
      ] = results.map((result) => (result.status === 'fulfilled' ? result.value : []));

      // Log detailed results for debugging
      results.forEach((result, index) => {
        const dataTypes = [
          'categories',
          'types',
          'statuses',
          'ageGroups',
          'citizenGroups',
          'departments',
          'projects',
        ];
        if (result.status === 'rejected') {
          console.warn(`⚠️ [${dataTypes[index].toUpperCase()}] Failed to load:`, result.reason);
        } else {
          console.log(`✅ [${dataTypes[index].toUpperCase()}] Loaded ${result.value.length} items`);
        }
      });

      // Update state with all available data
      const newLookupData = {
        categories,
        types,
        statuses,
        regions: userRegions,
        ageGroups,
        citizenGroups,
        departments,
        projects,
      };

      setLookupData(newLookupData);
      setIsDataInitialized(true);
      console.log('✅ Lookup data loaded and cached successfully');
    } catch (error) {
      console.error('❌ Error loading lookup data:', error);
      setIsDataInitialized(true);
    }
  };

  const refreshLookupData = async () => {
    setIsLoading(true);
    try {
      await loadLookupData();
    } catch (error) {
      console.error('❌ Error refreshing lookup data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshRegionData = async () => {
    setIsLoading(true);
    setRegionError(null);

    try {
      const result = await userRegionService.refreshRegions();
      if (result.success) {
        // Update regions in lookup data
        const userRegions = userRegionService.getAccessibleRegions();
        setLookupData((prev) => ({
          ...prev,
          regions: userRegions,
        }));
        console.log('✅ Region data refreshed successfully');
      } else {
        setRegionError({
          type: 'REFRESH_FAILED',
          message: result.error,
          title: 'Failed to Refresh Regions',
          action: 'Please check your connection and try again.',
        });
      }
    } catch (error) {
      console.error('❌ Error refreshing region data:', error);
      setRegionError({
        type: 'REFRESH_ERROR',
        message: error.message,
        title: 'Region Refresh Error',
        action: 'Please try again or contact support.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const performEmergencyCleanup = async () => {
    setIsLoading(true);
    try {
      console.log('🚨 Performing emergency database cleanup...');
      const result = await nuclearDataManager.emergencyCleanup();

      if (result.success) {
        // Reinitialize after cleanup
        await initializeDataServices();
        return { success: true, message: 'Emergency cleanup completed successfully' };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('❌ Emergency cleanup failed:', error);
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const getSystemStatus = async () => {
    try {
      const [healthStatus, regionStatus] = await Promise.all([
        nuclearDataManager.getSystemStatus(),
        userRegionService.getStatus(),
      ]);

      return {
        health: healthStatus,
        regions: regionStatus,
        lookupData: {
          categories: lookupData.categories.length,
          types: lookupData.types.length,
          statuses: lookupData.statuses.length,
          regions: lookupData.regions.length,
          ageGroups: lookupData.ageGroups.length,
          citizenGroups: lookupData.citizenGroups.length,
          departments: lookupData.departments.length,
          projects: lookupData.projects.length,
        },
        isDataInitialized,
        initializationError,
        regionError,
      };
    } catch (error) {
      console.error('❌ Error getting system status:', error);
      return { error: error.message };
    }
  };

  // Add method to refresh specific contact-related data
  const refreshContactData = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Refreshing contact-related data...');

      const [ageGroups, citizenGroups] = await Promise.all([
        lookupDataManager.getAgeGroups(),
        lookupDataManager.getCitizenGroups(),
      ]);

      setLookupData((prev) => ({
        ...prev,
        ageGroups,
        citizenGroups,
      }));

      console.log('✅ Contact data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing contact data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle authentication errors by logging out the user
  const handleAuthenticationError = async (error) => {
    console.error('🚨 Authentication error detected:', error);
    setInitializationError({
      message: 'Session expired or authentication failed',
      details: 'You will be redirected to the login screen.',
      requiresLogin: true,
    });

    // Show alert to user
    Alert.alert(
      'Authentication Error',
      'Your session has expired or credentials are invalid. You will be redirected to the login screen.',
      [
        {
          text: 'OK',
          onPress: async () => {
            // Clear data and logout
            await resetDataServices();
            await logout();
          },
        },
      ],
      { cancelable: false }
    );
  };

  // AuthErrorHandler component to monitor for authentication errors
  const AuthErrorHandler = () => {
    useEffect(() => {
      if (initializationError && initializationError.requiresLogin) {
        console.log('🔄 AuthErrorHandler: Authentication error detected in initialization');
      }
    }, [initializationError]);

    return null; // This component doesn't render anything
  };

  const contextValue = {
    // Data services
    dataManager,
    lookupDataManager,
    userRegionService,
    nuclearDataManager,

    // State
    isDataInitialized,
    isLoading,
    lookupData,
    syncStatus,
    initializationError,
    regionError,

    // Actions
    refreshRegionData,
    performEmergencyCleanup,
    getSystemStatus,
    refreshContactData,
    handleAuthenticationError,

    // Convenience getters
    getUserRegions: () => userRegionService.getAccessibleRegions(),
    getAssignedRegions: () => userRegionService.getAssignedRegions(),
    getTopLevelRegions: () => userRegionService.getTopLevelRegions(),
    getRegionChildren: (parentId) => userRegionService.getRegionChildren(parentId),
    hasAccessToRegion: (regionId) => userRegionService.hasAccessToRegion(regionId),

    // New logout functionality
    logout,
  };

  return (
    <DataContext.Provider value={contextValue}>
      <AuthErrorHandler />
      {children}
    </DataContext.Provider>
  );
}

export { DataContext, DataProvider };

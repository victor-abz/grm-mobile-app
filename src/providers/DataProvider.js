import React, { createContext, useContext, useEffect, useState } from 'react';
import lookupDataManager from '../services/LookupDataManager';
import nuclearDataManager from '../services/NuclearDataManager';
import userRegionService from '../services/UserRegionService';
import { AuthContext } from './AuthProvider';

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
  const { isAuthenticated, credentials, userInfo } = useContext(AuthContext);
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
      initializeDataServices();
    } else if (!isAuthenticated && isDataInitialized) {
      // User logged out, reset data
      resetDataServices();
    }
  }, [isAuthenticated, credentials]);

  const initializeDataServices = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setInitializationError(null);
    setRegionError(null);

    try {
      console.log('🔄 Initializing data services...');

      // Initialize LookupDataManager
      await lookupDataManager.initialize(credentials);

      // Initialize UserRegionService - simplified, no project needed
      // Backend automatically determines user's projects from their assignments
      const regionResult = await userRegionService.initialize(credentials);

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
      await loadLookupData();

      // Import DataManager dynamically
      const { default: DataManagerModule } = await import('../services/DataManager');
      await DataManagerModule.initialize(credentials);
      setDataManager(DataManagerModule);

      setIsDataInitialized(true);
      console.log('✅ All data services initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing data services:', error);
      setInitializationError({
        message: error.message,
        details: 'Failed to initialize data services. Please try logging in again.',
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

      // Load other lookup data
      const [categories, types, statuses, ageGroups, citizenGroups, departments, projects] =
        await Promise.all([
          lookupDataManager.getCategories(),
          lookupDataManager.getTypes(),
          lookupDataManager.getStatuses(),
          lookupDataManager.getAgeGroups(),
          lookupDataManager.getCitizenGroups(),
          lookupDataManager.getDepartments(),
          lookupDataManager.getProjects(),
        ]);

      console.log('🔍 [STEP2] Lookup data loaded:', {
        categories: categories.length,
        types: types.length,
        statuses: statuses.length,
        regions: userRegions.length,
        ageGroups: ageGroups.length,
        citizenGroups: citizenGroups.length,
        departments: departments.length,
        projects: projects.length,
      });

      setLookupData({
        categories,
        types,
        statuses,
        regions: userRegions, // Use user-specific regions
        ageGroups,
        citizenGroups,
        departments,
        projects,
      });

      console.log('✅ Lookup data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading lookup data:', error);
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
    refreshLookupData,
    refreshRegionData,
    performEmergencyCleanup,
    getSystemStatus,

    // Convenience getters
    getUserRegions: () => userRegionService.getAccessibleRegions(),
    getAssignedRegions: () => userRegionService.getAssignedRegions(),
    getTopLevelRegions: () => userRegionService.getTopLevelRegions(),
    getRegionChildren: (parentId) => userRegionService.getRegionChildren(parentId),
    hasAccessToRegion: (regionId) => userRegionService.hasAccessToRegion(regionId),
  };

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
}

export { DataContext, DataProvider };

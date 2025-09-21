import NetInfo from '@react-native-community/netinfo';
import { FrappeApp } from 'frappe-js-sdk';
import watermelonManager from '../database/watermelonManager';
import WatermelonSyncManager from './WatermelonSyncManager';
import lookupDataManager from './LookupDataManager';
import { logger } from '../utils/logger';

const DEFAULT_CONFIG = {
  url: '',
  tokenParams: {
    useToken: true,
    token: () => 'token',
    type: 'Bearer',
  },
};

/**
 * Helper function to extract data from Frappe API response format
 */
export function extractApiResponse(response) {
  // Handle the nested Frappe response format: { response: { message: { status, data } } }
  if (response?.response?.message) {
    const { message } = response.response;
    return {
      status: message.status,
      data: message.data,
      message: message.message || (message.status === 'success' ? 'Success' : 'Error'),
    };
  }

  // Handle the direct message format: { message: { status, data } }
  if (response?.message?.status) {
    const { message } = response;
    return {
      status: message.status,
      data: message.data,
      message: message.message || (message.status === 'success' ? 'Success' : 'Error'),
    };
  }

  // Handle direct response format (backward compatibility)
  if (response?.status) {
    return {
      status: response.status,
      data: response.data,
      message: response.message || (response.status === 'success' ? 'Success' : 'Error'),
    };
  }

  // Handle raw data response
  if (response && !response.status && !response.response && !response.message) {
    return {
      status: 'success',
      data: response,
      message: 'Success',
    };
  }

  // Default error response
  logger.error('DataManager: Unknown API response format', new Error('Invalid response format'), {
    responseType: typeof response,
    hasResponse: !!response,
  });
  return {
    status: 'error',
    data: null,
    message: 'Invalid response format',
  };
}

/**
 * API utility functions for lookup data
 */
const LookupAPI = {
  /**
   * Generic API call with error handling
   */
  async callAPI(call, endpoint, params = {}) {
    try {
      const rawResponse = await call.get(endpoint, params);
      return extractApiResponse(rawResponse);
    } catch (error) {
      logger.error('DataManager: API call failed', error, {
        endpoint,
        params: Object.keys(params),
      });
      return { status: 'error', data: null, message: error.message };
    }
  },

  /**
   * Fetch categories - return raw Frappe data
   */
  async getCategories(call, projectId = null) {
    logger.info('DataManager: Fetching categories from Frappe', { projectId });
    const response = await this.callAPI(call, 'egrm.api.lookup.categories', {
      project: projectId,
    });

    if (response.status === 'success') {
      logger.info('DataManager: Categories response success', {
        dataLength: response.data?.length || 0,
      });
      if (response.data && response.data.length > 0) {
        logger.debug('DataManager: Sample category from Frappe', {
          sampleCategory: {
            name: response.data[0].name,
            category_name: response.data[0].category_name,
            assigned_department_id: response.data[0].assigned_department_id,
            administrative_level_id: response.data[0].administrative_level_id,
            confidentiality_level: response.data[0].confidentiality_level,
          },
        });
      }
      // Return raw Frappe data directly - no transformation
      return response.data || [];
    }

    logger.warn('DataManager: Categories response failed or empty', {
      responseStatus: response.status,
      projectId,
    });
    return [];
  },

  /**
   * Fetch issue types - return raw Frappe data
   */
  async getTypes(call, projectId = null) {
    const response = await this.callAPI(call, 'egrm.api.lookup.types', { project: projectId });

    if (response.status === 'success') {
      // Return raw Frappe data directly - no transformation
      return response.data || [];
    }
    return [];
  },

  /**
   * Fetch statuses - return raw Frappe data
   */
  async getStatuses(call) {
    const response = await this.callAPI(call, 'egrm.api.lookup.statuses');

    if (response.status === 'success') {
      // Return raw Frappe data directly - no transformation
      return response.data || [];
    }
    return [];
  },

  /**
   * Fetch age groups - return raw Frappe data
   */
  async getAgeGroups(call) {
    const response = await this.callAPI(call, 'egrm.api.lookup.age_groups');

    if (response.status === 'success') {
      // Return raw Frappe data directly - no transformation
      return response.data || [];
    }
    return [];
  },

  /**
   * Fetch citizen groups - return raw Frappe data
   */
  async getCitizenGroups(call) {
    const response = await this.callAPI(call, 'egrm.api.lookup.citizen_groups');

    if (response.status === 'success') {
      let allCitizenGroups = [];

      // Handle nested structure from Frappe backend
      if (response.data.citizen_group_1) {
        allCitizenGroups = allCitizenGroups.concat(response.data.citizen_group_1);
      }
      if (response.data.citizen_group_2) {
        allCitizenGroups = allCitizenGroups.concat(response.data.citizen_group_2);
      }

      // Return raw Frappe data directly - no transformation
      return allCitizenGroups;
    }
    return [];
  },

  /**
   * Fetch departments - return raw Frappe data
   */
  async getDepartments(call) {
    const response = await this.callAPI(call, 'egrm.api.lookup.departments');

    if (response.status === 'success') {
      // Return raw Frappe data directly - no transformation
      return response.data || [];
    }
    return [];
  },

  /**
   * Fetch projects - return raw Frappe data
   */
  async getProjects(call) {
    const response = await this.callAPI(call, 'egrm.api.lookup.projects');

    if (response.status === 'success') {
      // Return raw Frappe data directly - no transformation
      return response.data || [];
    }
    return [];
  },

  /**
   * Fetch regions - return raw Frappe data
   */
  async getRegions(call, filters = {}) {
    const response = await this.callAPI(call, 'egrm.api.lookup.regions', filters);

    if (response.status === 'success') {
      // Return raw Frappe data directly - no transformation
      return response.data || [];
    }
    return [];
  },

  /**
   * Get user context from backend
   */
  async getUserContext(call) {
    try {
      // Try the user context endpoint first
      const response = await this.callAPI(call, 'egrm.api.lookup.get_user_context');

      if (response.status === 'success') {
        return response.data || {};
      }

      // If that fails, try to get basic user info
      logger.info('DataManager: Trying alternative user info endpoint');
      const userInfoResponse = await this.callAPI(call, 'frappe.auth.get_logged_user');

      if (userInfoResponse.status === 'success') {
        return {
          user: userInfoResponse.data,
          accessible_projects: [],
          accessible_regions: [],
          assignments: [],
          permissions: {},
        };
      }

      logger.warn('DataManager: Could not fetch user context, using empty context');
      return {};
    } catch (error) {
      logger.warn('DataManager: Failed to get user context', error);
      return {};
    }
  },

  /**
   * Store lookup data via WatermelonDB sync (removed custom bulk upsert)
   * Data will be stored through official WatermelonDB sync protocol
   */
  async storeLookupData(dataType, data) {
    try {
      console.log(
        `ℹ️ [DataManager] ${dataType} data will be synced through WatermelonDB sync protocol`
      );
      console.log(`✅ Background synced ${data.length} ${dataType} records`);
    } catch (error) {
      console.error(`❌ Error storing ${dataType} data:`, error);
    }
  },

  /**
   * Get table name for data type
   */
  getTableNameForDataType(dataType) {
    const tableMap = {
      categories: 'grm_issue_categories',
      types: 'grm_issue_types',
      statuses: 'grm_issue_statuses',
      age_groups: 'grm_issue_age_groups',
      citizen_groups: 'grm_issue_citizen_groups',
      departments: 'grm_issue_departments',
      projects: 'grm_projects',
      regions: 'grm_administrative_regions',
    };
    return tableMap[dataType];
  },
};

class DataManager {
  constructor() {
    this.call = null;
    this.config = DEFAULT_CONFIG;
    this.isOnline = false;
    this.credentials = null;
    this.userContext = null;

    // WatermelonDB sync manager
    this.syncManager = null;
    this.syncListeners = [];

    this.setupNetworkListener();
  }

  /**
   * Initialize DataManager with credentials and sync capability
   */
  async initialize(credentials = null) {
    const startTime = Date.now();
    logger.info('DataManager: Starting initialization', {
      hasCredentials: !!credentials,
      baseUrl: credentials?.url,
    });

    this.credentials = credentials;

    // Initialize Frappe SDK if credentials provided
    if (credentials) {
      try {
        await this.initializeFrappeConnection(credentials);
        logger.info('DataManager: Frappe SDK connection established');
        this.isOnline = true;

        // Initialize WatermelonDB sync manager
        this.syncManager = new WatermelonSyncManager(watermelonManager.getDatabase(), this.call);
        logger.info('DataManager: WatermelonDB sync manager initialized');

        // Initialize LookupDataManager with sync manager
        await lookupDataManager.initialize(this.syncManager, credentials);
        logger.info('DataManager: LookupDataManager initialized');

        // Initialize user context
        await this.initializeUserContext();
        logger.info('DataManager: User context initialized');
      } catch (error) {
        logger.error('DataManager: Error during online initialization', error, {
          baseUrl: credentials?.url,
          username: credentials?.username,
        });
        this.isOnline = false;
        this.call = null;
        this.syncManager = null;
      }
    } else {
      logger.info('DataManager: No credentials provided, offline mode only');
      this.isOnline = false;

      // Initialize LookupDataManager without sync manager
      await lookupDataManager.initialize(null, null);

      // Load user context from local storage if available
      const localContext = await this.loadLocalUserContext();
      if (localContext) {
        this.userContext = localContext;
        logger.info('DataManager: User context loaded from local storage');
      }
    }

    const duration = Date.now() - startTime;
    logger.performance('DataManager initialization', duration, {
      online: this.isOnline,
      hasCredentials: !!credentials,
    });
    return { success: true, message: 'DataManager initialized successfully' };
  }

  /**
   * Initialize Frappe connection with proper authentication
   */
  async initializeFrappeConnection(credentials) {
    try {
      if (!credentials) {
        throw new Error('Credentials are required for initialization');
      }

      if (!credentials.url) {
        throw new Error('URL is required in credentials');
      }

      if (!credentials.username || !credentials.password) {
        throw new Error('Username and password are required');
      }

      console.log('🔧 [DATAMANAGER] Creating Frappe app instance for URL:', credentials.url);

      // Create Frappe app instance
      const frappe = new FrappeApp(credentials.url);

      console.log('🔧 [DATAMANAGER] Authenticating with Frappe...');

      // Authenticate using the working pattern from previous commit
      const authResult = await frappe.auth().loginWithUsernamePassword({
        username: credentials.username,
        password: credentials.password,
      });

      console.log('🔧 [DATAMANAGER] Authentication result:', {
        success: !!authResult && !authResult.error,
        hasError: !!authResult?.error,
        errorMessage: authResult?.error,
      });

      // Check if authentication was successful
      if (!authResult || authResult.error) {
        throw new Error(`Authentication failed: ${authResult?.error || 'Unknown error'}`);
      }

      // Store the call instance
      this.call = frappe.call();
      console.log('✅ [DATAMANAGER] Frappe call instance created');

      // Test the connection with a simple API call
      try {
        console.log('🔧 [DATAMANAGER] Testing API connection...');
        const userResponse = await this.call.get('frappe.auth.get_logged_user');
        console.log(
          '✅ [DATAMANAGER] API connection test successful. User:',
          userResponse?.message
        );
      } catch (testError) {
        console.warn(
          '⚠️ [DATAMANAGER] API connection test failed, but proceeding:',
          testError.message
        );
        // Don't throw here, as the auth might still work for other calls
      }

      console.log('✅ [DATAMANAGER] Frappe connection initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ [DATAMANAGER] Error initializing Frappe connection:', error);
      this.call = null; // Reset call instance on failure
      throw error;
    }
  }

  /**
   * Initialize user context
   */
  async initializeUserContext() {
    try {
      if (!this.credentials) {
        console.log('⚠️ No credentials available for user context initialization');
        return;
      }

      console.log('🔄 Initializing user context...');

      if (this.isOnline && this.call) {
        try {
          const context = await LookupAPI.getUserContext(this.call);
          await this.setUserContext(context);
          console.log('✅ User context initialized from server');
          return;
        } catch (error) {
          console.warn('⚠️ Failed to get user context from server:', error.message);
        }
      }

      const localContext = await this.loadLocalUserContext();
      if (localContext) {
        this.userContext = localContext;
        console.log('📱 User context loaded from local storage');
      }
    } catch (error) {
      console.error('❌ Error initializing user context:', error);
    }
  }

  /**
   * Set user context and store in local database
   */
  async setUserContext(context) {
    try {
      this.userContext = context;

      // Get current user ID from credentials or context
      const userId =
        context.user?.name || context.user?.email || this.credentials?.username || 'current_user';

      // Store user context in WatermelonDB
      await watermelonManager.storeUserContext(userId, context);
      console.log('✅ User context stored successfully in WatermelonDB');
    } catch (error) {
      console.error('❌ Error storing user context:', error);
      throw error;
    }
  }

  /**
   * Load user context from local storage
   */
  async loadLocalUserContext() {
    try {
      const userId = this.credentials?.username || 'current_user';
      const context = await watermelonManager.getUserContext(userId);

      if (context) {
        console.log('📱 [DATAMANAGER] Local user context found for user:', userId);
        return context;
      }
      console.log('📱 [DATAMANAGER] No local user context found for user:', userId);
      return null;
    } catch (error) {
      console.error('❌ [DATAMANAGER] Error loading local user context:', error);
      return null;
    }
  }

  /**
   * Get user context
   */
  getUserContext() {
    return this.userContext;
  }

  /**
   * Perform sync using WatermelonDB sync manager
   */
  async performSync() {
    const startTime = Date.now();
    logger.info('DataManager: Starting sync operation');

    if (!this.syncManager) {
      const error = new Error('Sync manager not initialized');
      logger.error('DataManager: Sync failed - no sync manager', error);
      throw error;
    }

    try {
      await this.syncManager.sync();
      const duration = Date.now() - startTime;
      logger.performance('DataManager sync', duration);
      logger.info('DataManager: Sync operation completed successfully');
      return { success: true, message: 'Sync completed successfully' };
    } catch (error) {
      logger.error('DataManager: Sync operation failed', error, {
        syncManagerExists: !!this.syncManager,
        isOnline: this.isOnline,
      });
      throw error;
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    if (this.syncManager) {
      const status = this.syncManager.getSyncStatus();
      console.log('📊 [DATAMANAGER] Current sync status:', status);
      return status;
    }
    console.log('📊 [DATAMANAGER] No sync manager - returning offline status');
    return { isActive: false, lastSync: null };
  }

  /**
   * Get issues with sync-first approach
   */
  async getIssues(filters = {}) {
    try {
      console.log('🔍 [DATAMANAGER] Getting issues with filters:', filters);

      // Always try WatermelonDB first for reactive data
      console.log('🔍 [DATAMANAGER] Getting issues from WatermelonDB...');
      let localIssues = await watermelonManager.getIssues(filters);
      console.log(`🔍 [DATAMANAGER] Found ${localIssues.length} issues in local database`);

      // Apply additional filtering based on user context if needed
      if (filters.userContextFilter !== false) {
        const userContext = this.getUserContext();
        if (userContext && userContext.accessible_projects) {
          const accessibleProjectIds = userContext.accessible_projects.map((p) => p.id || p.name);
          if (accessibleProjectIds.length > 0 && !filters.project) {
            console.log(
              '🔍 [DATAMANAGER] Applying user context filtering for projects:',
              accessibleProjectIds
            );
            localIssues = localIssues.filter((issue) =>
              accessibleProjectIds.includes(issue.project)
            );
            console.log(
              `🔍 [DATAMANAGER] After user context filtering: ${localIssues.length} issues`
            );
          }
        }
      }

      // If we have local data and not forcing refresh, return it
      if (localIssues.length > 0 && !filters.forceRefresh) {
        console.log(`📱 [DATAMANAGER] Returning ${localIssues.length} issues from local database`);
        return localIssues;
      }

      // If no local data and we have sync capability, try sync
      if (localIssues.length === 0 && this.syncManager) {
        console.log('🔄 [DATAMANAGER] No local issues found, triggering sync...');

        try {
          await this.syncManager.sync();
          console.log('✅ [DATAMANAGER] Sync completed, retrying issues from local DB...');

          // Retry after sync
          localIssues = await watermelonManager.getIssues(filters);
          console.log(`🔍 [DATAMANAGER] Found ${localIssues.length} issues after sync`);

          // Apply user context filtering again if needed
          if (filters.userContextFilter !== false) {
            const userContext = this.getUserContext();
            if (userContext && userContext.accessible_projects) {
              const accessibleProjectIds = userContext.accessible_projects.map(
                (p) => p.id || p.name
              );
              if (accessibleProjectIds.length > 0 && !filters.project) {
                localIssues = localIssues.filter((issue) =>
                  accessibleProjectIds.includes(issue.project)
                );
                console.log(
                  `🔍 [DATAMANAGER] After user context filtering (post-sync): ${localIssues.length} issues`
                );
              }
            }
          }
        } catch (syncError) {
          console.error('❌ [DATAMANAGER] Sync failed while getting issues:', syncError);
          // Continue with empty data
        }
      }

      console.log(`📊 [DATAMANAGER] Returning ${localIssues.length} issues`);
      return localIssues;
    } catch (error) {
      console.error('❌ [DATAMANAGER] Error getting issues:', error);
      return [];
    }
  }

  /**
   * Get single issue by ID
   */
  static async getIssue(issueId) {
    try {
      console.log(`🔍 [DATAMANAGER] Getting issue: ${issueId}`);
      const issue = await watermelonManager.getIssue(issueId);

      if (issue) {
        console.log(`✅ [DATAMANAGER] Found issue: ${issueId}`);
      } else {
        console.log(`⚠️ [DATAMANAGER] Issue not found: ${issueId}`);
      }

      return issue;
    } catch (error) {
      console.error(`❌ [DATAMANAGER] Error getting issue ${issueId}:`, error);
      return null;
    }
  }

  /**
   * Get comprehensive statistics
   */
  async getStatistics(filters = {}) {
    try {
      console.log('📊 [DATAMANAGER] Getting statistics with filters:', filters);

      // Get all issues first
      const issues = await this.getIssues(filters);
      console.log(`📊 [DATAMANAGER] Processing statistics for ${issues.length} issues`);

      // Calculate basic statistics
      const stats = {
        total_issues: issues.length,
        by_status: {},
        by_category: {},
        by_project: {},
        by_region: {},
        recent_issues: issues.filter((issue) => {
          const issueDate = new Date(issue.issue_date || issue.created_at);
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          return issueDate >= thirtyDaysAgo;
        }).length,
        pending_issues: issues.filter(
          (issue) =>
            issue.status &&
            !['resolved', 'closed', 'completed'].includes(issue.status.toLowerCase())
        ).length,
      };

      // Group by status
      issues.forEach((issue) => {
        const { status } = issue;
        stats.by_status[status] = (stats.by_status[status] || 0) + 1;
      });

      // Group by category
      issues.forEach((issue) => {
        const { category } = issue;
        stats.by_category[category] = (stats.by_category[category] || 0) + 1;
      });

      // Group by project
      issues.forEach((issue) => {
        const { project } = issue;
        stats.by_project[project] = (stats.by_project[project] || 0) + 1;
      });

      // Group by region
      issues.forEach((issue) => {
        const region = issue.administrative_region;
        stats.by_region[region] = (stats.by_region[region] || 0) + 1;
      });

      console.log('📊 [DATAMANAGER] Statistics calculated:', JSON.stringify(stats, null, 2));
      return stats;
    } catch (error) {
      console.error('❌ [DATAMANAGER] Error getting statistics:', error);
      return {
        total_issues: 0,
        by_status: {},
        by_category: {},
        by_project: {},
        by_region: {},
        recent_issues: 0,
        pending_issues: 0,
      };
    }
  }

  /**
   * Setup network listener
   */
  setupNetworkListener() {
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected;

      if (wasOffline && this.isOnline) {
        logger.info('DataManager: Network status changed to online');
        // Perform background sync when coming back online
        this.performBackgroundSync();
      } else {
        logger.info('DataManager: Network status changed', {
          status: this.isOnline ? 'online' : 'offline',
        });
      }
    });
  }

  /**
   * Perform background sync using WatermelonSyncManager
   */
  async performBackgroundSync() {
    try {
      if (!this.syncManager || !this.isOnline) {
        return;
      }

      console.log('🔄 Performing background sync...');
      await this.syncManager.sync();
      console.log('✅ Background sync completed');
    } catch (error) {
      console.warn('⚠️ Background sync failed:', error.message);
    }
  }

  /**
   * Get user assignment for region
   */
  getUserAssignmentForRegion(regionId) {
    if (!this.userContext?.assignments) return null;
    return this.userContext.assignments.find((assignment) => assignment.region.id === regionId);
  }

  /**
   * Check if user has access to region
   */
  hasRegionAccess(regionId) {
    if (!this.userContext?.accessible_regions) return false;
    return this.userContext.accessible_regions.some((region) => region.name === regionId);
  }

  /**
   * Get user department for project
   */
  getUserDepartmentForProject(projectId) {
    if (!this.userContext?.assignments) return null;
    const assignment = this.userContext.assignments.find((a) => a.project.id === projectId);
    return assignment?.department;
  }

  /**
   * Check if user has permission
   */
  hasPermission(permission) {
    if (!this.userContext?.permissions) return false;
    return Object.values(this.userContext.permissions).some((rolePerms) => rolePerms[permission]);
  }

  /**
   * COMPATIBILITY METHODS - Delegate to LookupDataManager
   * These maintain compatibility with existing code that expects these methods on DataManager
   */

  /**
   * Get administrative regions
   */
  static async getAdministrativeRegions(filters = {}) {
    try {
      console.log('🔍 [DATAMANAGER] Getting administrative regions with filters:', filters);
      return await lookupDataManager.getAdministrativeRegions();
    } catch (error) {
      console.error('❌ [DATAMANAGER] Error getting administrative regions:', error);
      return [];
    }
  }

  /**
   * Get issue categories
   */
  static async getIssueCategories(projectId = null) {
    try {
      console.log('🔍 [DATAMANAGER] Getting issue categories for project:', projectId);
      return await lookupDataManager.getIssueCategories();
    } catch (error) {
      console.error('❌ [DATAMANAGER] Error getting issue categories:', error);
      return [];
    }
  }

  /**
   * Get issue types
   */
  static async getIssueTypes(projectId = null) {
    try {
      console.log('🔍 [DATAMANAGER] Getting issue types for project:', projectId);
      return await lookupDataManager.getIssueTypes();
    } catch (error) {
      console.error('❌ [DATAMANAGER] Error getting issue types:', error);
      return [];
    }
  }

  /**
   * Get issue statuses
   */
  static async getIssueStatuses() {
    try {
      console.log('🔍 [DATAMANAGER] Getting issue statuses');
      return await lookupDataManager.getIssueStatuses();
    } catch (error) {
      console.error('❌ [DATAMANAGER] Error getting issue statuses:', error);
      return [];
    }
  }

  /**
   * Get age groups
   */
  static async getAgeGroups() {
    try {
      console.log('🔍 [DATAMANAGER] Getting age groups');
      return await lookupDataManager.getIssueAgeGroups();
    } catch (error) {
      console.error('❌ [DATAMANAGER] Error getting age groups:', error);
      return [];
    }
  }

  /**
   * Get citizen groups
   */
  static async getCitizenGroups() {
    try {
      console.log('🔍 [DATAMANAGER] Getting citizen groups');
      return await lookupDataManager.getIssueCitizenGroups();
    } catch (error) {
      console.error('❌ [DATAMANAGER] Error getting citizen groups:', error);
      return [];
    }
  }

  /**
   * Get departments
   */
  static async getDepartments() {
    try {
      console.log('🔍 [DATAMANAGER] Getting departments');
      return await lookupDataManager.getIssueDepartments();
    } catch (error) {
      console.error('❌ [DATAMANAGER] Error getting departments:', error);
      return [];
    }
  }

  /**
   * Get projects
   */
  static async getProjects() {
    try {
      console.log('🔍 [DATAMANAGER] Getting projects');
      return await lookupDataManager.getProjects();
    } catch (error) {
      console.error('❌ [DATAMANAGER] Error getting projects:', error);
      return [];
    }
  }

  /**
   * Get issue attachments
   */
  static async getIssueAttachments(issueId) {
    try {
      console.log(`🔍 [DATAMANAGER] Getting issue attachments for: ${issueId}`);
      // TODO: Implement attachments in WatermelonDB sync
      console.warn('⚠️ [DATAMANAGER] Issue attachments not yet implemented in sync');
      return [];
    } catch (error) {
      console.error('❌ [DATAMANAGER] Error getting issue attachments:', error);
      return [];
    }
  }

  /**
   * Get user assigned issues
   */
  async getUserAssignedIssues(userId) {
    try {
      console.log(`🔍 [DATAMANAGER] Getting user assigned issues for: ${userId}`);
      return await this.getIssues({ assignee: userId });
    } catch (error) {
      console.error('❌ [DATAMANAGER] Error getting user assigned issues:', error);
      return [];
    }
  }

  /**
   * Get user reported issues
   */
  async getUserReportedIssues(userId) {
    try {
      console.log(`🔍 [DATAMANAGER] Getting user reported issues for: ${userId}`);
      return await this.getIssues({ reporter: userId });
    } catch (error) {
      console.error('❌ [DATAMANAGER] Error getting user reported issues:', error);
      return [];
    }
  }

  /**
   * Get issues by status
   */
  async getIssuesByStatus(statusId, userId = null) {
    try {
      console.log(`🔍 [DATAMANAGER] Getting issues by status: ${statusId}, user: ${userId}`);
      const filters = { status: statusId };

      if (userId) {
        console.warn(
          '⚠️ [DATAMANAGER] User filtering in getIssuesByStatus - implementing as separate calls'
        );
        // Get all issues with status and filter manually for now
        const allIssues = await this.getIssues(filters);
        return allIssues.filter((issue) => issue.assignee === userId || issue.reporter === userId);
      }

      return await this.getIssues(filters);
    } catch (error) {
      console.error('❌ [DATAMANAGER] Error getting issues by status:', error);
      return [];
    }
  }

  /**
   * Create issue with sync-compatible data mapping
   */
  async createIssue(issueData) {
    try {
      logger.info('DataManager: Creating issue', {
        category: issueData.category,
        project: issueData.project,
        hasDescription: !!issueData.description,
      });

      // Ensure field names are correct (remove any legacy _id suffixes if they exist)
      const mappedData = {
        ...issueData,
        // Map legacy field names to correct field names if needed
        project: issueData.project || issueData.project_id,
        category: issueData.category || issueData.category_id,
        issue_type: issueData.issue_type || issueData.issue_type_id,
        status: issueData.status || issueData.status_id,
        citizen_age_group: issueData.citizen_age_group || issueData.citizen_age_group_id,
        citizen_group_1: issueData.citizen_group_1 || issueData.citizen_group_1_id,
        citizen_group_2: issueData.citizen_group_2 || issueData.citizen_group_2_id,
        reporter: issueData.reporter || issueData.reporter_id,
        assignee: issueData.assignee || issueData.assignee_id,
        administrative_region:
          issueData.administrative_region || issueData.administrative_region_id,
        amended_from: issueData.amended_from || issueData.amended_from_id,
      };

      // Remove legacy field names to avoid confusion
      delete mappedData.project_id;
      delete mappedData.category_id;
      delete mappedData.issue_type_id;
      delete mappedData.status_id;
      delete mappedData.citizen_age_group_id;
      delete mappedData.citizen_group_1_id;
      delete mappedData.citizen_group_2_id;
      delete mappedData.reporter_id;
      delete mappedData.assignee_id;
      delete mappedData.administrative_region_id;
      delete mappedData.amended_from_id;

      // Create issue locally (will be synced via WatermelonDB sync)
      const createdIssue = await watermelonManager.createIssue(mappedData);
      logger.info('DataManager: Issue created locally', {
        issueId: createdIssue?.id,
        project: mappedData.project,
        category: mappedData.category,
      });

      // Inform sync manager that local data has changed so it can update pending counts
      if (this.syncManager) {
        try {
          // Refresh pending changes (fire & forget)
          this.syncManager.refreshPendingChanges();

          // Automatically initiate a sync to push the newly created issue
          if (!this.syncManager.syncInProgress) {
            // Do not await to avoid blocking UI; errors are caught and logged.
            this.syncManager.sync().catch((err) => {
              console.warn('[DATAMANAGER] Auto-sync after issue creation failed:', err.message);
            });
          }
        } catch (autoSyncErr) {
          console.warn('[DATAMANAGER] Failed to trigger auto-sync:', autoSyncErr.message);
        }
      }

      return createdIssue;
    } catch (error) {
      logger.error('DataManager: Error creating issue', error, {
        category: issueData?.category,
        project: issueData?.project,
      });
      throw error;
    }
  }

  /**
   * Update issue with sync-compatible data mapping
   */
  static async updateIssue(issueId, updateData) {
    try {
      console.log('🔧 [DATAMANAGER] Updating issue:', issueId, 'with data:', updateData);

      // Ensure field names are correct (remove any legacy _id suffixes if they exist)
      const mappedData = {
        ...updateData,
        // Map legacy field names to correct field names if needed
        project: updateData.project || updateData.project_id,
        category: updateData.category || updateData.category_id,
        issue_type: updateData.issue_type || updateData.issue_type_id,
        status: updateData.status || updateData.status_id,
        citizen_age_group: updateData.citizen_age_group || updateData.citizen_age_group_id,
        citizen_group_1: updateData.citizen_group_1 || updateData.citizen_group_1_id,
        citizen_group_2: updateData.citizen_group_2 || updateData.citizen_group_2_id,
        reporter: updateData.reporter || updateData.reporter_id,
        assignee: updateData.assignee || updateData.assignee_id,
        administrative_region:
          updateData.administrative_region || updateData.administrative_region_id,
        amended_from: updateData.amended_from || updateData.amended_from_id,
      };

      // Remove legacy field names to avoid confusion
      delete mappedData.project_id;
      delete mappedData.category_id;
      delete mappedData.issue_type_id;
      delete mappedData.status_id;
      delete mappedData.citizen_age_group_id;
      delete mappedData.citizen_group_1_id;
      delete mappedData.citizen_group_2_id;
      delete mappedData.reporter_id;
      delete mappedData.assignee_id;
      delete mappedData.administrative_region_id;
      delete mappedData.amended_from_id;

      console.log('🔧 [DATAMANAGER] Mapped update data:', mappedData);

      // Update issue locally (will be synced via WatermelonDB sync)
      const updatedIssue = await watermelonManager.updateIssue(issueId, mappedData);
      console.log('✅ [DATAMANAGER] Issue updated locally:', updatedIssue?.id);

      return updatedIssue;
    } catch (error) {
      console.error('❌ [DATAMANAGER] Error updating issue:', error);
      throw error;
    }
  }

  /**
   * Upload attachment (sync-compatible implementation)
   */
  async uploadAttachment(issueId, attachmentData) {
    try {
      console.log(`🔧 [DATAMANAGER] Uploading attachment for issue: ${issueId}`);

      if (!this.call) {
        throw new Error('No API connection available for attachment upload');
      }

      const response = await this.call.post('egrm.api.issue.upload_attachment', {
        issue_id: issueId,
        attachment_data: attachmentData,
      });

      const apiResponse = extractApiResponse(response);

      if (apiResponse.status === 'success') {
        console.log('✅ [DATAMANAGER] Attachment uploaded successfully');
        return apiResponse.data;
      }
      throw new Error(apiResponse.message || 'Failed to upload attachment');
    } catch (error) {
      console.error('❌ [DATAMANAGER] Error uploading attachment:', error);
      throw error;
    }
  }

  /**
   * Get local issues with user context filtering
   */
  async getLocalIssues(userId) {
    try {
      console.log(`🔍 [DATAMANAGER] Getting local issues for user: ${userId}`);

      const filters = {};
      const userContext = this.getUserContext();

      if (userContext?.accessible_projects) {
        const projectIds = userContext.accessible_projects.map((p) => p.id || p.name);
        if (projectIds.length > 0) {
          const [firstProject] = projectIds;
          filters.project = firstProject; // Use first accessible project for now
          console.log('🔍 [DATAMANAGER] Filtering by user accessible project:', filters.project);
        }
      }

      const allIssues = await this.getIssues(filters);

      // Filter by user
      const userIssues = allIssues.filter(
        (issue) => issue.assignee === userId || issue.reporter === userId
      );

      console.log(`📊 [DATAMANAGER] Found ${userIssues.length} local issues for user ${userId}`);
      return userIssues;
    } catch (error) {
      console.error('❌ [DATAMANAGER] Error getting local issues:', error);
      return [];
    }
  }
}

// Create singleton instance
const dataManager = new DataManager();

// Export both the default instance and the LookupAPI for use by LookupDataManager
export { LookupAPI };
export default dataManager;

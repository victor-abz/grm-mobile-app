import NetInfo from '@react-native-community/netinfo';
import { FrappeApp } from 'frappe-js-sdk';
import watermelonManager from '../database/watermelonManager';

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
  console.error('❌ Unknown API response format:', response);
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
      console.warn(`⚠️ API call failed for ${endpoint}:`, error.message);
      return { status: 'error', data: null, message: error.message };
    }
  },

  /**
   * Fetch and transform categories
   */
  async getCategories(call, projectId = null) {
    const response = await this.callAPI(call, 'egrm.api.lookup.categories', {
      project_id: projectId,
    });

    if (response.status === 'success') {
      return response.data.map((category) => ({
        _id: category.name,
        type: 'issue_category',
        id: category.name,
        name: category.category_name,
        label: category.category_name,
        value: category.name,
        description: category.description,
        department: category.department,
        department_name: category.department_name,
        assigned_department: category.assigned_department,
        auto_assign: category.auto_assign,
        active: category.active,
        project: projectId,
      }));
    }
    return [];
  },

  /**
   * Fetch and transform issue types
   */
  async getTypes(call, projectId = null) {
    const response = await this.callAPI(call, 'egrm.api.lookup.types', { project_id: projectId });

    if (response.status === 'success') {
      return response.data.map((type) => ({
        _id: type.name,
        type: 'issue_type',
        id: type.name,
        name: type.type_name,
        label: type.type_name,
        value: type.name,
        description: type.description,
        active: type.active,
        project: projectId,
      }));
    }
    return [];
  },

  /**
   * Fetch and transform statuses
   */
  async getStatuses(call) {
    const response = await this.callAPI(call, 'egrm.api.lookup.statuses');

    if (response.status === 'success') {
      return response.data.map((status) => ({
        _id: status.name,
        type: 'issue_status',
        id: status.name,
        name: status.status_name,
        label: status.status_name,
        value: status.name,
        description: status.description,
        initial_status: status.initial_status,
        open_status: status.open_status,
        rejected_status: status.rejected_status,
        final_status: status.final_status,
        appealed_status: status.appealed_status,
        color: status.color,
      }));
    }
    return [];
  },

  /**
   * Fetch and transform age groups
   */
  async getAgeGroups(call) {
    const response = await this.callAPI(call, 'egrm.api.lookup.age_groups');

    if (response.status === 'success') {
      return response.data.map((ageGroup) => ({
        _id: ageGroup.name,
        type: 'age_group',
        id: ageGroup.name,
        name: ageGroup.age_group_name,
        label: ageGroup.age_group_name,
        value: ageGroup.name,
        min_age: ageGroup.min_age,
        max_age: ageGroup.max_age,
        active: ageGroup.active !== undefined ? ageGroup.active : 1,
      }));
    }
    return [];
  },

  /**
   * Fetch and transform citizen groups
   */
  async getCitizenGroups(call) {
    const response = await this.callAPI(call, 'egrm.api.lookup.citizen_groups');

    if (response.status === 'success') {
      let allCitizenGroups = [];

      // Handle nested structure
      if (response.data.citizen_group_1) {
        allCitizenGroups = allCitizenGroups.concat(response.data.citizen_group_1);
      }
      if (response.data.citizen_group_2) {
        allCitizenGroups = allCitizenGroups.concat(response.data.citizen_group_2);
      }

      return allCitizenGroups.map((citizenGroup) => ({
        _id: citizenGroup.name,
        type: 'citizen_group',
        id: citizenGroup.name,
        name: citizenGroup.group_name,
        label: citizenGroup.group_name,
        value: citizenGroup.name,
        description: citizenGroup.description || citizenGroup.group_name,
        group_type: citizenGroup.group_type,
        active: citizenGroup.active !== undefined ? citizenGroup.active : 1,
      }));
    }
    return [];
  },

  /**
   * Fetch and transform departments
   */
  async getDepartments(call) {
    const response = await this.callAPI(call, 'egrm.api.lookup.departments');

    if (response.status === 'success') {
      return response.data.map((department) => ({
        _id: department.name,
        type: 'department',
        id: department.name,
        name: department.department_name,
        label: department.department_name,
        value: department.name,
        description: department.description,
        active: department.active,
      }));
    }
    return [];
  },

  /**
   * Fetch and transform projects
   */
  async getProjects(call) {
    const response = await this.callAPI(call, 'egrm.api.lookup.projects');

    if (response.status === 'success') {
      return response.data.map((project) => ({
        _id: project.name,
        type: 'project',
        id: project.name,
        name: project.title,
        label: project.title,
        value: project.name,
        description: project.description,
        start_date: project.start_date,
        end_date: project.end_date,
        active: project.is_active,
      }));
    }
    return [];
  },

  /**
   * Fetch and transform regions
   */
  async getRegions(call, filters = {}) {
    const response = await this.callAPI(call, 'egrm.api.lookup.regions', filters);

    if (response.status === 'success') {
      return response.data.map((region) => ({
        _id: region.name,
        type: 'administrative_level',
        administrative_id: region.name,
        name: region.region_name,
        administrative_level: region.administrative_level,
        parent_id: region.parent_region,
        latitude: region.latitude,
        longitude: region.longitude,
        project: region.project,
      }));
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
      console.log('🔄 Trying alternative user info endpoint...');
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

      console.warn('⚠️ Could not fetch user context, using empty context');
      return {};
    } catch (error) {
      console.warn('⚠️ Failed to get user context:', error.message);
      return {};
    }
  },

  /**
   * Store lookup data in WatermelonDB
   */
  async storeLookupData(dataType, data) {
    try {
      const tableName = this.getTableNameForDataType(dataType);
      if (tableName) {
        await watermelonManager.bulkUpsertLookupData(tableName, data);
        console.log(`✅ Stored ${data.length} ${dataType} records in WatermelonDB`);
      }
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
    this.isOnline = true;
    this.credentials = null;
    this.userContext = null;
    this.lastSyncTimestamp = null;
    this.syncListeners = [];
    this.syncStatus = {
      isActive: false,
      phase: 'idle',
      progress: 0,
      totalItems: 0,
      currentItem: 0,
      error: null,
      lastSuccessfulSync: null,
    };
    this.setupNetworkListener();
  }

  /**
   * Initialize the data manager with credentials
   */
  async initialize(credentials = null) {
    try {
      console.log(
        '🔄 DataManager.initialize called with credentials:',
        credentials ? 'present' : 'null'
      );
      if (credentials) {
        this.credentials = credentials;
        await this.initializeFrappeConnection(credentials);
      } else {
        console.log('⚠️ No credentials provided to DataManager.initialize');
      }

      // Initialize user context first
      await this.initializeUserContext();

      // Perform initial sync if needed
      await this.performInitialSyncIfNeeded();

      console.log('✅ DataManager initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing DataManager:', error);
      throw error;
    }
  }

  /**
   * Initialize Frappe connection
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

      this.config.url = credentials.url;

      // Create Frappe app instance
      const frappe = new FrappeApp(this.config.url);

      console.log('🔄 Authenticating with Frappe...');

      // Authenticate with better error handling - FIXED: Pass credentials as object
      const authResult = await frappe.auth().loginWithUsernamePassword({
        username: credentials.username,
        password: credentials.password,
      });

      // Check if authentication was successful
      if (!authResult || authResult.error) {
        throw new Error(`Authentication failed: ${authResult?.error || 'Unknown error'}`);
      }

      // Store the call instance
      this.call = frappe.call();

      // Test the connection with a simple API call
      try {
        console.log('🔄 Testing API connection...');
        await this.call.get('frappe.auth.get_logged_user');
        console.log('✅ API connection test successful');
      } catch (testError) {
        console.warn('⚠️ API connection test failed, but proceeding:', testError.message);
        // Don't throw here, as the auth might still work for other calls
      }

      console.log('✅ Frappe connection initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing Frappe connection:', error);
      this.call = null; // Reset call instance on failure
      throw error;
    }
  }

  /**
   * Perform initial sync if needed
   */
  async performInitialSyncIfNeeded() {
    try {
      if (!this.call || !this.isOnline) {
        console.log('⚠️ Skipping initial sync - offline or no connection');
        return;
      }

      const hasUserData = await this.hasUserDataBeenSynced();
      if (!hasUserData) {
        console.log('🔄 Performing initial data sync...');
        await this.getInitialUserData();
      }
    } catch (error) {
      console.warn('⚠️ Initial sync failed during initialization:', error.message);
    }
  }

  /**
   * Set credentials (wrapper for initialize)
   */
  async setCredentials(credentials) {
    this.credentials = credentials;
    if (credentials) {
      await this.initializeFrappeConnection(credentials);
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
        console.log('🌐 Network status changed: online');
        // Perform background sync when coming back online
        this.performBackgroundSync();
      } else {
        console.log(`🌐 Network status changed: ${this.isOnline ? 'online' : 'offline'}`);
      }
    });
  }

  /**
   * Get issues with enhanced filtering and caching
   */
  async getIssues(filters = {}) {
    try {
      // Always try WatermelonDB first for reactive data
      console.log('🔍 [WatermelonDB] Getting issues from local database...');
      let localIssues = await watermelonManager.getIssues(filters);

      // Apply additional filtering based on user context if needed
      if (filters.userContextFilter !== false) {
        const userContext = this.getUserContext();
        if (userContext && userContext.accessible_projects) {
          const accessibleProjectIds = userContext.accessible_projects.map((p) => p.id);
          if (accessibleProjectIds.length > 0 && !filters.project_id) {
            // If no specific project filter and user has accessible projects, filter to first accessible project
            localIssues = localIssues.filter((issue) =>
              accessibleProjectIds.includes(issue.project_id)
            );
          }
        }
      }

      // If we have local data and not forcing refresh, return it
      if (localIssues.length > 0 && !filters.forceRefresh) {
        console.log(`📱 [WatermelonDB] Returning ${localIssues.length} issues from local database`);
        return localIssues;
      }

      // Try to fetch from backend API if online
      if (this.isOnline && this.call) {
        try {
          console.log('🌐 [WatermelonDB] Fetching issues from backend API...');

          const filterParams = {};
          if (filters.project_id) filterParams.project_id = filters.project_id;
          if (filters.status_id) filterParams.status_id = filters.status_id;
          if (filters.category_id) filterParams.category_id = filters.category_id;
          if (filters.assignee_id) filterParams.assignee_id = filters.assignee_id;
          if (filters.reporter_id) filterParams.reporter_id = filters.reporter_id;
          if (filters.administrative_region_id)
            filterParams.administrative_region_id = filters.administrative_region_id;
          if (filters.from_date) filterParams.from_date = filters.from_date;
          if (filters.to_date) filterParams.to_date = filters.to_date;

          // Apply user context filtering if needed
          const userContext = this.getUserContext();
          if (userContext && userContext.accessible_projects && !filters.project_id) {
            const accessibleProjectIds = userContext.accessible_projects.map((p) => p.id);
            if (accessibleProjectIds.length > 0) {
              filterParams.project_id = accessibleProjectIds[0];
            }
          }

          const rawResponse = await this.call.get('egrm.api.issue.get_latest_issues', filterParams);
          const response = extractApiResponse(rawResponse);

          if (response.status === 'success' && response.data && Array.isArray(response.data)) {
            console.log(`✅ [WatermelonDB] Received ${response.data.length} issues from backend`);

            // Store the issues in WatermelonDB
            await watermelonManager.bulkUpsertIssues(response.data);

            return response.data;
          } else {
            console.warn(
              '⚠️ [WatermelonDB] Backend returned no issues or error:',
              response.message
            );
          }
        } catch (error) {
          console.warn(
            '⚠️ [WatermelonDB] API call failed, falling back to local data:',
            error.message
          );
        }
      }

      // Return local data as fallback
      console.log(
        `📱 [WatermelonDB] Fallback: returning ${localIssues.length} issues from local database`
      );
      return localIssues;
    } catch (error) {
      console.error('❌ Error getting issues:', error);
      return [];
    }
  }

  /**
   * Get single issue
   */
  async getIssue(issueId) {
    try {
      return await watermelonManager.getIssue(issueId);
    } catch (error) {
      console.error('❌ Error getting issue:', error);
      return null;
    }
  }

  /**
   * Create issue
   */
  async createIssue(issueData) {
    try {
      if (this.isOnline && this.call) {
        // Create via API first
        const issue = await this.createIssueViaAPI(issueData);
        // Store in local database
        await watermelonManager.createIssue(issue);
        return issue;
      } else {
        // Create locally and sync later
        return await watermelonManager.createIssue(issueData);
      }
    } catch (error) {
      console.error('❌ Error creating issue:', error);
      throw error;
    }
  }

  /**
   * Create issue via API
   */
  async createIssueViaAPI(issueData) {
    try {
      const response = await this.call.post('egrm.api.issue.create_issue', {
        issue_data: issueData,
      });
      const apiResponse = extractApiResponse(response);

      if (apiResponse.status === 'success') {
        return apiResponse.data;
      } else {
        throw new Error(apiResponse.message || 'Failed to create issue');
      }
    } catch (error) {
      console.error('❌ Error creating issue via API:', error);
      throw error;
    }
  }

  /**
   * Update issue
   */
  async updateIssue(issueId, updateData) {
    try {
      if (this.isOnline && this.call) {
        // Update via API first
        const issue = await this.updateIssueViaAPI(issueId, updateData);
        // Update in local database
        await watermelonManager.updateIssue(issueId, issue);
        return issue;
      } else {
        // Update locally and sync later
        return await watermelonManager.updateIssue(issueId, updateData);
      }
    } catch (error) {
      console.error('❌ Error updating issue:', error);
      throw error;
    }
  }

  /**
   * Update issue via API
   */
  async updateIssueViaAPI(issueId, updateData) {
    try {
      const response = await this.call.put(`egrm.api.issue.update_issue`, {
        issue_id: issueId,
        update_data: updateData,
      });
      const apiResponse = extractApiResponse(response);

      if (apiResponse.status === 'success') {
        return apiResponse.data;
      } else {
        throw new Error(apiResponse.message || 'Failed to update issue');
      }
    } catch (error) {
      console.error('❌ Error updating issue via API:', error);
      throw error;
    }
  }

  /**
   * Delete issue
   */
  async deleteIssue(issueId) {
    try {
      return await watermelonManager.deleteIssue(issueId);
    } catch (error) {
      console.error('❌ Error deleting issue:', error);
      throw error;
    }
  }

  /**
   * Validate issue data
   */
  validateIssueData(issueData) {
    const required = ['title', 'description', 'category_id', 'project_id'];
    const missing = required.filter((field) => !issueData[field]);

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    return true;
  }

  /**
   * Get administrative regions
   */
  async getAdministrativeRegions(filters = {}) {
    try {
      // Try local first
      let regions = await watermelonManager.getAdministrativeRegions(filters);

      if (regions.length > 0 && !filters.forceRefresh) {
        return regions;
      }

      // Fetch from API if online
      if (this.isOnline && this.call) {
        const apiRegions = await LookupAPI.getRegions(this.call, filters);
        if (apiRegions.length > 0) {
          await LookupAPI.storeLookupData('regions', apiRegions);
          return apiRegions;
        }
      }

      return regions;
    } catch (error) {
      console.error('❌ Error getting administrative regions:', error);
      return [];
    }
  }

  /**
   * Get issue categories
   */
  async getIssueCategories(projectId = null) {
    try {
      // Try local first
      let categories = await watermelonManager.getIssueCategories(projectId);

      if (categories.length > 0) {
        return categories;
      }

      // Fetch from API if online
      if (this.isOnline && this.call) {
        const apiCategories = await LookupAPI.getCategories(this.call, projectId);
        if (apiCategories.length > 0) {
          await LookupAPI.storeLookupData('categories', apiCategories);
          return apiCategories;
        }
      }

      return categories;
    } catch (error) {
      console.error('❌ Error getting issue categories:', error);
      return [];
    }
  }

  /**
   * Get issue types
   */
  async getIssueTypes(projectId = null) {
    try {
      // Try local first
      let types = await watermelonManager.getIssueTypes(projectId);

      if (types.length > 0) {
        return types;
      }

      // Fetch from API if online
      if (this.isOnline && this.call) {
        const apiTypes = await LookupAPI.getTypes(this.call, projectId);
        if (apiTypes.length > 0) {
          await LookupAPI.storeLookupData('types', apiTypes);
          return apiTypes;
        }
      }

      return types;
    } catch (error) {
      console.error('❌ Error getting issue types:', error);
      return [];
    }
  }

  /**
   * Get issue statuses
   */
  async getIssueStatuses() {
    try {
      // Try local first
      let statuses = await watermelonManager.getIssueStatuses();

      if (statuses.length > 0) {
        return statuses;
      }

      // Fetch from API if online
      if (this.isOnline && this.call) {
        const apiStatuses = await LookupAPI.getStatuses(this.call);
        if (apiStatuses.length > 0) {
          await LookupAPI.storeLookupData('statuses', apiStatuses);
          return apiStatuses;
        }
      }

      return statuses;
    } catch (error) {
      console.error('❌ Error getting issue statuses:', error);
      return [];
    }
  }

  /**
   * Get age groups
   */
  async getAgeGroups() {
    try {
      // Try local first
      let ageGroups = await watermelonManager.getAgeGroups();

      if (ageGroups.length > 0) {
        return ageGroups;
      }

      // Fetch from API if online
      if (this.isOnline && this.call) {
        const apiAgeGroups = await LookupAPI.getAgeGroups(this.call);
        if (apiAgeGroups.length > 0) {
          await LookupAPI.storeLookupData('age_groups', apiAgeGroups);
          return apiAgeGroups;
        }
      }

      return ageGroups;
    } catch (error) {
      console.error('❌ Error getting age groups:', error);
      return [];
    }
  }

  /**
   * Get citizen groups
   */
  async getCitizenGroups() {
    try {
      // Try local first
      let citizenGroups = await watermelonManager.getCitizenGroups();

      if (citizenGroups.length > 0) {
        return citizenGroups;
      }

      // Fetch from API if online
      if (this.isOnline && this.call) {
        const apiCitizenGroups = await LookupAPI.getCitizenGroups(this.call);
        if (apiCitizenGroups.length > 0) {
          await LookupAPI.storeLookupData('citizen_groups', apiCitizenGroups);
          return apiCitizenGroups;
        }
      }

      return citizenGroups;
    } catch (error) {
      console.error('❌ Error getting citizen groups:', error);
      return [];
    }
  }

  /**
   * Get departments
   */
  async getDepartments() {
    try {
      // Try local first
      let departments = await watermelonManager.getDepartments();

      if (departments.length > 0) {
        return departments;
      }

      // Fetch from API if online
      if (this.isOnline && this.call) {
        const apiDepartments = await LookupAPI.getDepartments(this.call);
        if (apiDepartments.length > 0) {
          await LookupAPI.storeLookupData('departments', apiDepartments);
          return apiDepartments;
        }
      }

      return departments;
    } catch (error) {
      console.error('❌ Error getting departments:', error);
      return [];
    }
  }

  /**
   * Get projects
   */
  async getProjects() {
    try {
      // Try local first
      let projects = await watermelonManager.getProjects();

      if (projects.length > 0) {
        return projects;
      }

      // Fetch from API if online
      if (this.isOnline && this.call) {
        const apiProjects = await LookupAPI.getProjects(this.call);
        if (apiProjects.length > 0) {
          await LookupAPI.storeLookupData('projects', apiProjects);
          return apiProjects;
        }
      }

      return projects;
    } catch (error) {
      console.error('❌ Error getting projects:', error);
      return [];
    }
  }

  /**
   * Upload attachment
   */
  async uploadAttachment(issueId, attachmentData) {
    try {
      if (!this.call) {
        throw new Error('No API connection available');
      }

      const response = await this.call.post('egrm.api.issue.upload_attachment', {
        issue_id: issueId,
        attachment_data: attachmentData,
      });

      const apiResponse = extractApiResponse(response);

      if (apiResponse.status === 'success') {
        return apiResponse.data;
      } else {
        throw new Error(apiResponse.message || 'Failed to upload attachment');
      }
    } catch (error) {
      console.error('❌ Error uploading attachment:', error);
      throw error;
    }
  }

  /**
   * Get issue attachments
   */
  async getIssueAttachments(issueId) {
    try {
      // TODO: Implement attachments in WatermelonDB
      console.warn('getIssueAttachments - TODO: Implement attachments in WatermelonDB');
      return [];
    } catch (error) {
      console.error('❌ Error getting issue attachments:', error);
      return [];
    }
  }

  /**
   * Search issues
   */
  async searchIssues(searchTerm, filters = {}) {
    try {
      // TODO: Implement search in WatermelonDB
      console.warn('searchIssues - TODO: Implement search in WatermelonDB');
      const allIssues = await this.getIssues(filters);

      // Basic search implementation
      return allIssues
        .filter(
          (issue) =>
            issue.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            issue.tracking_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            issue.citizen?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 50);
    } catch (error) {
      console.error('❌ Error searching issues:', error);
      return [];
    }
  }

  /**
   * Get user assigned issues
   */
  async getUserAssignedIssues(userId) {
    try {
      return await this.getIssues({ assignee_id: userId });
    } catch (error) {
      console.error('❌ Error getting user assigned issues:', error);
      return [];
    }
  }

  /**
   * Get user reported issues
   */
  async getUserReportedIssues(userId) {
    try {
      return await this.getIssues({ reporter_id: userId });
    } catch (error) {
      console.error('❌ Error getting user reported issues:', error);
      return [];
    }
  }

  /**
   * Get issues by status
   */
  async getIssuesByStatus(statusId, userId = null) {
    try {
      const filters = { status_id: statusId };
      // TODO: Implement OR logic for user filtering in WatermelonDB
      if (userId) {
        console.warn('getIssuesByStatus with userId - TODO: Implement OR logic in WatermelonDB');
      }
      return await this.getIssues(filters);
    } catch (error) {
      console.error('❌ Error getting issues by status:', error);
      return [];
    }
  }

  /**
   * Get statistics
   */
  async getStatistics(userId = null) {
    try {
      const allIssues = await this.getIssues();
      const userIssues = userId
        ? allIssues.filter((issue) => issue.assignee_id === userId || issue.reporter_id === userId)
        : allIssues;

      const statuses = await this.getIssueStatuses();

      const stats = {
        total_issues: userIssues.length,
        open_issues: this.countIssuesByStatusType(userIssues, statuses, 'open_status'),
        resolved_issues: this.countIssuesByStatusType(userIssues, statuses, 'final_status'),
        pending_issues: this.countIssuesByStatusType(userIssues, statuses, 'initial_status'),
      };

      if (userId) {
        stats.assigned_issues = userIssues.filter((issue) => issue.assignee_id === userId).length;
        stats.reported_issues = userIssues.filter((issue) => issue.reporter_id === userId).length;
      }

      return stats;
    } catch (error) {
      console.error('❌ Error getting statistics:', error);
      throw error;
    }
  }

  /**
   * Count issues by status type
   */
  countIssuesByStatusType(issues, statuses, statusType) {
    const relevantStatuses = statuses.filter((s) => s[statusType]);
    return issues.filter((issue) => relevantStatuses.some((s) => s.name === issue.status_id))
      .length;
  }

  /**
   * Check if user data has been synced
   */
  async hasUserDataBeenSynced() {
    try {
      // TODO: Implement proper user data sync check with WatermelonDB
      return false;
    } catch (error) {
      console.error('Error checking user data sync status:', error);
      return false;
    }
  }

  /**
   * Get initial user data
   */
  async getInitialUserData() {
    try {
      console.log('🔄 Getting initial user data...');

      if (!this.isOnline) {
        throw new Error('Cannot sync while offline');
      }

      this.updateSyncStatus({ isActive: true, phase: 'initial_sync', progress: 0 });

      // Load lookup data
      await this.syncLookupData();

      this.updateSyncStatus({
        isActive: false,
        phase: 'completed',
        progress: 100,
        lastSuccessfulSync: new Date().toISOString(),
      });

      console.log('✅ Initial user data sync completed');
    } catch (error) {
      this.updateSyncStatus({
        isActive: false,
        phase: 'error',
        error: error.message,
      });
      console.error('❌ Error getting initial user data:', error);
      throw error;
    }
  }

  /**
   * Sync lookup data
   */
  async syncLookupData() {
    try {
      console.log('🔄 Syncing lookup data...');

      const lookupTypes = [
        'categories',
        'types',
        'statuses',
        'age_groups',
        'citizen_groups',
        'departments',
        'projects',
        'regions',
      ];

      let completed = 0;
      const total = lookupTypes.length;

      for (const lookupType of lookupTypes) {
        try {
          console.log(`🔄 Syncing ${lookupType}...`);
          await this.syncLookupType(lookupType);
          completed++;

          this.updateSyncStatus({
            progress: Math.round((completed / total) * 100),
            currentItem: completed,
            totalItems: total,
          });
        } catch (error) {
          console.warn(`⚠️ Failed to sync ${lookupType}:`, error.message);
        }
      }

      console.log('✅ Lookup data sync completed');
    } catch (error) {
      console.error('❌ Error syncing lookup data:', error);
      throw error;
    }
  }

  /**
   * Sync lookup type
   */
  async syncLookupType(lookupType) {
    try {
      let data = [];

      switch (lookupType) {
        case 'categories':
          data = await LookupAPI.getCategories(this.call);
          break;
        case 'types':
          data = await LookupAPI.getTypes(this.call);
          break;
        case 'statuses':
          data = await LookupAPI.getStatuses(this.call);
          break;
        case 'age_groups':
          data = await LookupAPI.getAgeGroups(this.call);
          break;
        case 'citizen_groups':
          data = await LookupAPI.getCitizenGroups(this.call);
          break;
        case 'departments':
          data = await LookupAPI.getDepartments(this.call);
          break;
        case 'projects':
          data = await LookupAPI.getProjects(this.call);
          break;
        case 'regions':
          data = await LookupAPI.getRegions(this.call);
          break;
        default:
          console.warn(`Unknown lookup type: ${lookupType}`);
          return;
      }

      if (data.length > 0) {
        await LookupAPI.storeLookupData(lookupType, data);
        console.log(`✅ Synced ${data.length} ${lookupType} records`);
      }
    } catch (error) {
      console.error(`❌ Error syncing ${lookupType}:`, error);
      throw error;
    }
  }

  /**
   * Perform sync
   */
  async performSync(projectId = null) {
    if (!this.credentials) {
      throw new Error('Authentication credentials not available. Please log in again.');
    }

    if (!this.isOnline) {
      throw new Error('Cannot sync while offline. Please check your internet connection.');
    }

    console.log('🔄 Starting manual sync...');
    await this.syncLookupData();
    console.log('✅ Manual sync completed successfully');
  }

  /**
   * Perform background sync
   */
  async performBackgroundSync() {
    try {
      if (!this.call || !this.isOnline) {
        return;
      }

      console.log('🔄 Performing background sync...');
      await this.syncLookupData();
      console.log('✅ Background sync completed');
    } catch (error) {
      console.warn('⚠️ Background sync failed:', error.message);
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      ...this.syncStatus,
      hasCredentials: !!this.credentials,
      dataManagerStatus: this.call ? 'ready' : 'not_initialized',
    };
  }

  /**
   * Update sync status
   */
  updateSyncStatus(updates) {
    this.syncStatus = { ...this.syncStatus, ...updates };
    this.notifySyncListeners();
  }

  /**
   * Add sync listener
   */
  addSyncListener(listener) {
    this.syncListeners.push(listener);
  }

  /**
   * Remove sync listener
   */
  removeSyncListener(listener) {
    const index = this.syncListeners.indexOf(listener);
    if (index > -1) {
      this.syncListeners.splice(index, 1);
    }
  }

  /**
   * Notify sync listeners
   */
  notifySyncListeners() {
    this.syncListeners.forEach((listener) => {
      try {
        listener(this.syncStatus);
      } catch (error) {
        console.error('Error notifying sync listener:', error);
      }
    });
  }

  /**
   * Force full resync
   */
  async forceFullResync(projectId = null) {
    try {
      console.log('🔄 Starting force full resync...');
      await this.clearAllData();
      await this.syncLookupData();
      console.log('✅ Force full resync completed');
    } catch (error) {
      console.error('❌ Error during force full resync:', error);
      throw error;
    }
  }

  /**
   * Is network online
   */
  isNetworkOnline() {
    return this.isOnline;
  }

  /**
   * Force cleanup databases
   */
  async forceCleanupDatabases() {
    try {
      console.log('🧹 Force cleanup of WatermelonDB...');
      await watermelonManager.clearAllData();
      console.log('✅ Force cleanup completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Error during force cleanup:', error);
      return false;
    }
  }

  /**
   * Clear user context
   */
  async clearUserContext() {
    try {
      const userId = this.credentials?.username || 'current_user';
      await watermelonManager.clearUserContext(userId);
      this.userContext = null;
      console.log('✅ User context cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing user context:', error);
    }
  }

  /**
   * Clear all data
   */
  async clearAllData() {
    try {
      console.log('🗑️ Clearing all local data...');

      // Clear user context first
      await this.clearUserContext();

      // Clear all WatermelonDB data
      await watermelonManager.clearAllData();
      console.log('✅ All local data cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing local data:', error);
      throw error;
    }
  }

  /**
   * Export data
   */
  async exportData() {
    try {
      // TODO: Implement export functionality for WatermelonDB
      console.warn('exportData - TODO: Implement WatermelonDB export');
      return {
        watermelon_data: [], // TODO: Export WatermelonDB data
        export_date: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error exporting data:', error);
      throw error;
    }
  }

  /**
   * Import data
   */
  async importData(backupData) {
    try {
      // TODO: Implement import functionality for WatermelonDB
      console.warn('importData - TODO: Implement WatermelonDB import');
      console.log('✅ Data imported successfully (placeholder)');
    } catch (error) {
      console.error('❌ Error importing data:', error);
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
   * Set user context
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
   * Load local user context
   */
  async loadLocalUserContext() {
    try {
      // Get current user ID from credentials
      const userId = this.credentials?.username || 'current_user';

      // Load user context from WatermelonDB
      const context = await watermelonManager.getUserContext(userId);
      console.log('📱 User context loaded from WatermelonDB');
      return context;
    } catch (error) {
      console.error('❌ Error loading local user context:', error);
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
   * Get local issues
   */
  async getLocalIssues(userId) {
    try {
      const filters = {};
      const userContext = this.getUserContext();

      if (userContext?.accessible_projects) {
        filters.project_id = userContext.accessible_projects[0]?.id;
      }

      const allIssues = await this.getIssues(filters);

      // Filter by user
      return allIssues.filter(
        (issue) => issue.assignee_id === userId || issue.reporter_id === userId
      );
    } catch (error) {
      console.error('❌ Error getting local issues:', error);
      return [];
    }
  }
}

// Create singleton instance
const dataManager = new DataManager();

export default dataManager;

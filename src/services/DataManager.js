import NetInfo from '@react-native-community/netinfo';
import { LocalDatabase, LocalGRMDatabase } from '../utils/databaseManager';
import frappeSyncManager from './FrappeSyncManager';

/**
 * Helper function to extract data from Frappe API response format
 */
function extractApiResponse(response) {
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
  async callAPI(endpoint, params = {}) {
    try {
      const call = frappeSyncManager.getCall();
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
  async getCategories(projectId = null) {
    const response = await this.callAPI('egrm.api.lookup.categories', {
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
  async getTypes(projectId = null) {
    const response = await this.callAPI('egrm.api.lookup.types', { project_id: projectId });

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
  async getStatuses() {
    const response = await this.callAPI('egrm.api.lookup.statuses');

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
  async getAgeGroups() {
    const response = await this.callAPI('egrm.api.lookup.age_groups');

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
  async getCitizenGroups() {
    const response = await this.callAPI('egrm.api.lookup.citizen_groups');

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
  async getDepartments() {
    const response = await this.callAPI('egrm.api.lookup.departments');

    if (response.status === 'success') {
      return response.data.map((department) => ({
        _id: department.name,
        type: 'department',
        id: department.name,
        name: department.department_name,
        label: department.department_name,
        value: department.name,
        description: department.description || department.department_name,
        active: department.active !== undefined ? department.active : 1,
      }));
    }
    return [];
  },

  /**
   * Fetch and transform projects
   */
  async getProjects() {
    const response = await this.callAPI('egrm.api.lookup.projects');

    if (response.status === 'success') {
      return response.data.map((project) => ({
        _id: project.name,
        type: 'project',
        id: project.name,
        name: project.project_name,
        label: project.project_name,
        value: project.name,
        description: project.description || project.project_name,
        start_date: project.start_date,
        end_date: project.end_date,
        active: project.active !== undefined ? project.active : project.is_active || 1,
      }));
    }
    return [];
  },

  /**
   * Fetch and transform regions
   */
  async getRegions(filters = {}) {
    const params = {};
    if (filters.project) params.project_id = filters.project;
    if (filters.parent_id) params.parent_id = filters.parent_id;
    if (filters.administrative_level) params.administrative_level = filters.administrative_level;

    const response = await this.callAPI('egrm.api.lookup.regions', params);

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
};

/**
 * Database utility functions
 */
const DatabaseUtils = {
  /**
   * Upsert document to local database with error handling
   */
  async upsertDocument(database, doc) {
    try {
      const existing = await database.get(doc._id);
      doc._rev = existing._rev;
    } catch (error) {
      // Document doesn't exist, that's fine
    }

    try {
      await database.put(doc);
      return true;
    } catch (error) {
      if (this.isStorageError(error)) {
        console.warn('⚠️ Database storage full, attempting cleanup...');
        await this.cleanupDatabase(database);
        try {
          await database.put(doc);
          return true;
        } catch (retryError) {
          console.error('❌ Failed to store document even after cleanup:', retryError);
          return false;
        }
      }
      throw error;
    }
  },

  /**
   * Check if error is storage-related
   */
  isStorageError(error) {
    return (
      error.status === 413 || error.message?.includes('SQLITE_FULL') || error.name === 'unknown'
    );
  },

  /**
   * Clean up database to free storage space
   */
  async cleanupDatabase(database) {
    try {
      console.log('🧹 Starting database cleanup...');
      const allDocs = await database.allDocs({ include_docs: true });

      if (allDocs.rows.length === 0) {
        console.log('📱 No documents to clean up');
        return;
      }

      const sortedDocs = allDocs.rows
        .map((row) => row.doc)
        .sort((a, b) => {
          const dateA = new Date(a.modified_date || a.creation || a._rev || 0);
          const dateB = new Date(b.modified_date || b.creation || b._rev || 0);
          return dateB - dateA;
        });

      // Keep only the most recent 80% of documents
      const keepCount = Math.floor(sortedDocs.length * 0.8);
      const docsToDelete = sortedDocs.slice(keepCount);

      console.log(`🗑️ Cleaning up ${docsToDelete.length} out of ${sortedDocs.length} documents`);

      // Delete old documents in batches
      const batchSize = 50;
      for (let i = 0; i < docsToDelete.length; i += batchSize) {
        const batch = docsToDelete.slice(i, i + batchSize);
        await Promise.allSettled(batch.map((doc) => database.remove(doc)));
      }

      console.log('✅ Database cleanup completed');
    } catch (error) {
      console.error('❌ Error during database cleanup:', error);
    }
  },

  /**
   * Query documents with error handling
   */
  async findDocuments(database, selector, sortField = null) {
    try {
      const result = await database.find({ selector });

      if (sortField) {
        return result.docs.sort((a, b) => {
          const valueA = a[sortField] || '';
          const valueB = b[sortField] || '';
          return valueA.localeCompare(valueB);
        });
      }

      return result.docs;
    } catch (error) {
      console.error(`❌ Error querying database:`, error);
      return [];
    }
  },
};

class DataManager {
  constructor() {
    this.isInitialized = false;
    this.isOnline = true;
    this.credentials = null;
    this.setupNetworkListener();
  }

  /**
   * Initialize the data manager with user credentials
   */
  async initialize(credentials = null) {
    if (this.isInitialized && !credentials) return;

    try {
      if (credentials) {
        this.credentials = credentials;
      }

      if (this.credentials) {
        await frappeSyncManager.initialize(this.credentials);
      }

      await this.performInitialSyncIfNeeded();

      this.isInitialized = true;
      console.log('✅ DataManager initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing DataManager:', error);
      throw error;
    }
  }

  /**
   * Perform initial sync if needed
   */
  async performInitialSyncIfNeeded() {
    const hasUserData = await frappeSyncManager.hasUserDataBeenSynced();
    if (!hasUserData && this.isOnline && this.credentials) {
      console.log('🔄 Performing initial data sync...');
      await frappeSyncManager.getInitialUserData();
    }
  }

  /**
   * Set credentials for API calls
   */
  async setCredentials(credentials) {
    this.credentials = credentials;
    await frappeSyncManager.setCredentials(credentials);

    if (credentials && this.isOnline) {
      await this.performInitialSyncIfNeeded();
    }
  }

  /**
   * Setup network listener
   */
  setupNetworkListener() {
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected;
      frappeSyncManager.setOnlineStatus(this.isOnline);

      console.log('🌐 Network status changed:', this.isOnline ? 'online' : 'offline');
    });
  }

  /**
   * Issue Management Methods
   */
  async getIssues(filters = {}) {
    try {
      const selector = { type: 'issue' };

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          const selectorKey =
            key === 'status'
              ? 'status.id'
              : key === 'assignee'
              ? 'assignee.id'
              : key === 'reporter'
              ? 'reporter.id'
              : key === 'category'
              ? 'category.id'
              : key;
          selector[selectorKey] = value;
        }
      });

      const result = await LocalGRMDatabase.find({ selector });

      // Sort by creation date (descending)
      return result.docs.sort((a, b) => {
        const dateA = new Date(a.created_date || a.creation || 0);
        const dateB = new Date(b.created_date || b.creation || 0);
        return dateB - dateA;
      });
    } catch (error) {
      console.error('❌ Error getting issues:', error);
      throw error;
    }
  }

  async getIssue(issueId) {
    try {
      return await LocalGRMDatabase.get(issueId);
    } catch (error) {
      if (error.status === 404) return null;
      console.error('❌ Error getting issue:', error);
      throw error;
    }
  }

  async createIssue(issueData) {
    this.validateIssueData(issueData);
    console.log('🔄 Creating issue with data:', issueData);

    const issue = await frappeSyncManager.createIssue(issueData);
    console.log('✅ Issue created successfully:', issue._id);
    return issue;
  }

  async updateIssue(issueId, updateData) {
    if (!issueId) throw new Error('Issue ID is required');
    if (!updateData || Object.keys(updateData).length === 0) {
      throw new Error('Update data is required');
    }

    console.log('🔄 Updating issue:', issueId, 'with data:', updateData);
    const issue = await frappeSyncManager.updateIssue(issueId, updateData);
    console.log('✅ Issue updated successfully:', issueId);
    return issue;
  }

  async deleteIssue(issueId) {
    try {
      const issue = await LocalGRMDatabase.get(issueId);
      await LocalGRMDatabase.remove(issue);

      if (!issue.is_local) {
        await frappeSyncManager.addPendingChange({
          action: 'delete',
          type: 'issue',
          id: issueId,
        });
      }

      return true;
    } catch (error) {
      console.error('❌ Error deleting issue:', error);
      throw error;
    }
  }

  /**
   * Validate issue data
   */
  validateIssueData(issueData) {
    const requiredFields = ['description'];
    for (const field of requiredFields) {
      if (!issueData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  /**
   * Lookup Data Methods with API-first approach
   */
  async getAdministrativeRegions(filters = {}) {
    console.log('🔍 [LOOKUP] Getting administrative regions...');

    if (this.isOnline && this.credentials) {
      try {
        const apiData = await LookupAPI.getRegions(filters);
        if (apiData.length > 0) {
          // Store in local database for caching
          for (const region of apiData) {
            await DatabaseUtils.upsertDocument(LocalDatabase, region);
          }
          console.log('✅ [LOOKUP] Regions API response:', apiData.length);
          return apiData;
        }
      } catch (error) {
        console.log('⚠️ [LOOKUP] Regions API failed, falling back to local data:', error.message);
      }
    }

    // Fallback to local database
    const selector = { type: 'administrative_level' };
    Object.entries(filters).forEach(([key, value]) => {
      if (value) selector[key] = value;
    });

    const localData = await DatabaseUtils.findDocuments(LocalDatabase, selector, 'name');
    console.log('📱 [LOOKUP] Local regions found:', localData.length);
    return localData;
  }

  async getIssueCategories(projectId = null) {
    console.log('🔍 [LOOKUP] Getting issue categories...');

    if (this.isOnline && this.credentials) {
      try {
        const apiData = await LookupAPI.getCategories(projectId);
        if (apiData.length > 0) {
          // Store in local database for caching
          for (const category of apiData) {
            await DatabaseUtils.upsertDocument(LocalDatabase, category);
          }
          console.log('✅ [LOOKUP] Categories API response:', apiData.length);
          return apiData;
        }
      } catch (error) {
        console.log(
          '⚠️ [LOOKUP] Categories API failed, falling back to local data:',
          error.message
        );
      }
    }

    // Fallback to local database
    const selector = { type: 'issue_category' };
    if (projectId) selector.project = projectId;

    const localData = await DatabaseUtils.findDocuments(LocalDatabase, selector, 'name');
    console.log('📱 [LOOKUP] Local categories found:', localData.length);
    return localData;
  }

  async getIssueTypes(projectId = null) {
    console.log('🔍 [LOOKUP] Getting issue types...');

    if (this.isOnline && this.credentials) {
      try {
        const apiData = await LookupAPI.getTypes(projectId);
        if (apiData.length > 0) {
          // Store in local database for caching
          for (const type of apiData) {
            await DatabaseUtils.upsertDocument(LocalDatabase, type);
          }
          console.log('✅ [LOOKUP] Types API response:', apiData.length);
          return apiData;
        }
      } catch (error) {
        console.log('⚠️ [LOOKUP] Types API failed, falling back to local data:', error.message);
      }
    }

    // Fallback to local database
    const selector = { type: 'issue_type' };
    if (projectId) selector.project = projectId;

    const localData = await DatabaseUtils.findDocuments(LocalDatabase, selector, 'name');
    console.log('📱 [LOOKUP] Local types found:', localData.length);
    return localData;
  }

  async getIssueStatuses() {
    console.log('🔍 [LOOKUP] Getting issue statuses...');

    if (this.isOnline && this.credentials) {
      try {
        const apiData = await LookupAPI.getStatuses();
        if (apiData.length > 0) {
          // Store in local database for caching
          for (const status of apiData) {
            await DatabaseUtils.upsertDocument(LocalDatabase, status);
          }
          console.log('✅ [LOOKUP] Statuses API response:', apiData.length);
          return apiData;
        }
      } catch (error) {
        console.log('⚠️ [LOOKUP] Statuses API failed, falling back to local data:', error.message);
      }
    }

    // Fallback to local database
    const localData = await DatabaseUtils.findDocuments(
      LocalDatabase,
      { type: 'issue_status' },
      'name'
    );
    console.log('📱 [LOOKUP] Local statuses found:', localData.length);
    return localData;
  }

  async getAgeGroups() {
    console.log('🔍 [LOOKUP] Getting age groups...');

    if (this.isOnline && this.credentials) {
      try {
        const apiData = await LookupAPI.getAgeGroups();
        if (apiData.length > 0) {
          // Store in local database for caching
          for (const ageGroup of apiData) {
            await DatabaseUtils.upsertDocument(LocalDatabase, ageGroup);
          }
          console.log('✅ [LOOKUP] Age groups API response:', apiData.length);
          return apiData;
        }
      } catch (error) {
        console.log(
          '⚠️ [LOOKUP] Age groups API failed, falling back to local data:',
          error.message
        );
      }
    }

    // Fallback to local database
    const localData = await DatabaseUtils.findDocuments(
      LocalDatabase,
      { type: 'age_group' },
      'name'
    );
    console.log('📱 [LOOKUP] Local age groups found:', localData.length);
    return localData;
  }

  async getCitizenGroups() {
    console.log('🔍 [LOOKUP] Getting citizen groups...');

    if (this.isOnline && this.credentials) {
      try {
        const apiData = await LookupAPI.getCitizenGroups();
        if (apiData.length > 0) {
          // Store in local database for caching
          for (const citizenGroup of apiData) {
            await DatabaseUtils.upsertDocument(LocalDatabase, citizenGroup);
          }
          console.log('✅ [LOOKUP] Citizen groups API response:', apiData.length);
          return apiData;
        }
      } catch (error) {
        console.log(
          '⚠️ [LOOKUP] Citizen groups API failed, falling back to local data:',
          error.message
        );
      }
    }

    // Fallback to local database
    const localData = await DatabaseUtils.findDocuments(
      LocalDatabase,
      { type: 'citizen_group' },
      'name'
    );
    console.log('📱 [LOOKUP] Local citizen groups found:', localData.length);
    return localData;
  }

  async getDepartments() {
    console.log('🔍 [LOOKUP] Getting departments...');

    if (this.isOnline && this.credentials) {
      try {
        const apiData = await LookupAPI.getDepartments();
        if (apiData.length > 0) {
          // Store in local database for caching
          for (const department of apiData) {
            await DatabaseUtils.upsertDocument(LocalDatabase, department);
          }
          console.log('✅ [LOOKUP] Departments API response:', apiData.length);
          return apiData;
        }
      } catch (error) {
        console.log(
          '⚠️ [LOOKUP] Departments API failed, falling back to local data:',
          error.message
        );
      }
    }

    // Fallback to local database
    const localData = await DatabaseUtils.findDocuments(
      LocalDatabase,
      { type: 'department' },
      'name'
    );
    console.log('📱 [LOOKUP] Local departments found:', localData.length);
    return localData;
  }

  async getProjects() {
    console.log('🔍 [LOOKUP] Getting projects...');

    if (this.isOnline && this.credentials) {
      try {
        const apiData = await LookupAPI.getProjects();
        if (apiData.length > 0) {
          // Store in local database for caching
          for (const project of apiData) {
            await DatabaseUtils.upsertDocument(LocalDatabase, project);
          }
          console.log('✅ [LOOKUP] Projects API response:', apiData.length);
          return apiData;
        }
      } catch (error) {
        console.log('⚠️ [LOOKUP] Projects API failed, falling back to local data:', error.message);
      }
    }

    // Fallback to local database
    const localData = await DatabaseUtils.findDocuments(LocalDatabase, { type: 'project' }, 'name');
    console.log('📱 [LOOKUP] Local projects found:', localData.length);
    return localData;
  }

  /**
   * Attachment Methods
   */
  async uploadAttachment(issueId, attachmentData) {
    return await frappeSyncManager.uploadAttachment(issueId, attachmentData);
  }

  async getIssueAttachments(issueId) {
    return await DatabaseUtils.findDocuments(
      LocalGRMDatabase,
      { type: 'attachment', issue_id: issueId },
      'upload_date'
    );
  }

  /**
   * Search Methods
   */
  async searchIssues(searchTerm, filters = {}) {
    try {
      const selector = {
        type: 'issue',
        $or: [
          { title: { $regex: new RegExp(searchTerm, 'i') } },
          { description: { $regex: new RegExp(searchTerm, 'i') } },
          { tracking_code: { $regex: new RegExp(searchTerm, 'i') } },
          { citizen: { $regex: new RegExp(searchTerm, 'i') } },
        ],
      };

      // Apply additional filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          const selectorKey = key === 'status' ? 'status.id' : 'category.id';
          selector[selectorKey] = value;
        }
      });

      const result = await LocalGRMDatabase.find({ selector, limit: 50 });

      // Sort by creation date (descending)
      return result.docs.sort((a, b) => {
        const dateA = new Date(a.created_date || a.creation || 0);
        const dateB = new Date(b.created_date || b.creation || 0);
        return dateB - dateA;
      });
    } catch (error) {
      console.error('❌ Error searching issues:', error);
      return [];
    }
  }

  /**
   * User-specific Methods
   */
  async getUserAssignedIssues(userId) {
    return await DatabaseUtils.findDocuments(LocalGRMDatabase, {
      type: 'issue',
      'assignee.id': userId,
    });
  }

  async getUserReportedIssues(userId) {
    return await DatabaseUtils.findDocuments(LocalGRMDatabase, {
      type: 'issue',
      'reporter.id': userId,
    });
  }

  async getIssuesByStatus(statusId, userId = null) {
    const selector = { type: 'issue', 'status.id': statusId };

    if (userId) {
      selector.$or = [{ 'assignee.id': userId }, { 'reporter.id': userId }];
    }

    return await DatabaseUtils.findDocuments(LocalGRMDatabase, selector);
  }

  /**
   * Statistics Methods
   */
  async getStatistics(userId = null) {
    try {
      const allIssues = await this.getIssues();
      const userIssues = userId
        ? allIssues.filter(
            (issue) => issue.assignee?.id === userId || issue.reporter?.id === userId
          )
        : allIssues;

      const statuses = await this.getIssueStatuses();

      const stats = {
        total_issues: userIssues.length,
        open_issues: this.countIssuesByStatusType(userIssues, statuses, 'open_status'),
        resolved_issues: this.countIssuesByStatusType(userIssues, statuses, 'final_status'),
        pending_issues: this.countIssuesByStatusType(userIssues, statuses, 'initial_status'),
      };

      if (userId) {
        stats.assigned_issues = userIssues.filter((issue) => issue.assignee?.id === userId).length;
        stats.reported_issues = userIssues.filter((issue) => issue.reporter?.id === userId).length;
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
    return issues.filter((issue) => relevantStatuses.some((s) => s._id === issue.status?.id))
      .length;
  }

  /**
   * Sync Methods
   */
  async performSync(projectId = null) {
    if (!this.credentials) {
      throw new Error('Authentication credentials not available. Please log in again.');
    }

    if (!this.isOnline) {
      throw new Error('Cannot sync while offline. Please check your internet connection.');
    }

    console.log('🔄 Starting manual sync...');
    await frappeSyncManager.performSync(projectId);
    console.log('✅ Manual sync completed successfully');
  }

  getSyncStatus() {
    const baseStatus = frappeSyncManager.getSyncStatus();
    return {
      ...baseStatus,
      isInitialized: this.isInitialized,
      hasCredentials: !!this.credentials,
      dataManagerStatus: this.isInitialized ? 'ready' : 'not_initialized',
    };
  }

  addSyncListener(listener) {
    frappeSyncManager.addSyncListener(listener);
  }

  removeSyncListener(listener) {
    frappeSyncManager.removeSyncListener(listener);
  }

  async forceFullResync(projectId = null) {
    await frappeSyncManager.forceFullResync(projectId);
  }

  isNetworkOnline() {
    return this.isOnline;
  }

  /**
   * Data Management Methods
   */
  async forceCleanupDatabases() {
    try {
      console.log('🧹 Force cleanup of all databases...');
      await Promise.all([
        DatabaseUtils.cleanupDatabase(LocalDatabase),
        DatabaseUtils.cleanupDatabase(LocalGRMDatabase),
      ]);
      console.log('✅ Force cleanup completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Error during force cleanup:', error);
      return false;
    }
  }

  async clearAllData() {
    try {
      console.log('🗑️ Clearing all local data...');

      const [grmDocs, eadlDocs] = await Promise.all([
        LocalGRMDatabase.allDocs({ include_docs: true }),
        LocalDatabase.allDocs({ include_docs: true }),
      ]);

      // Delete documents in batches
      await this.deleteBatch(LocalGRMDatabase, grmDocs.rows);
      await this.deleteBatch(LocalDatabase, eadlDocs.rows);

      console.log('✅ All local data cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing local data:', error);
      throw error;
    }
  }

  /**
   * Delete documents in batches
   */
  async deleteBatch(database, rows) {
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      await Promise.allSettled(batch.map((row) => database.remove(row.doc)));
    }
  }

  async exportData() {
    try {
      const [grmDocs, eadlDocs] = await Promise.all([
        LocalGRMDatabase.allDocs({ include_docs: true }),
        LocalDatabase.allDocs({ include_docs: true }),
      ]);

      return {
        grm_data: grmDocs.rows.map((row) => row.doc),
        eadl_data: eadlDocs.rows.map((row) => row.doc),
        export_date: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error exporting data:', error);
      throw error;
    }
  }

  async importData(backupData) {
    try {
      await this.clearAllData();

      const importPromises = [];

      if (backupData.grm_data) {
        importPromises.push(...backupData.grm_data.map((doc) => LocalGRMDatabase.put(doc)));
      }

      if (backupData.eadl_data) {
        importPromises.push(...backupData.eadl_data.map((doc) => LocalDatabase.put(doc)));
      }

      await Promise.allSettled(importPromises);
      console.log('✅ Data imported successfully');
    } catch (error) {
      console.error('❌ Error importing data:', error);
      throw error;
    }
  }
}

// Create singleton instance
const dataManager = new DataManager();

export default dataManager;
 
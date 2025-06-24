import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { Q } from '@nozbe/watermelondb';

import schema from './schema';
import migrations from './migrations';
import { modelClasses } from './models';

/**
 * WatermelonDB Manager for GRM Mobile App
 * Provides reactive, high-performance database operations using SQLite
 */
class WatermelonManager {
  constructor() {
    this.database = null;
    this.syncInProgress = false; // Add flag to track sync operations
    this.isInitialized = false;
    this._initializeDatabase();
  }

  /**
   * Initialize the database lazily
   */
  _initializeDatabase() {
    if (!this.database) {
      try {
        // Create the SQLite adapter
        const adapter = new SQLiteAdapter({
          schema,
          // Disable JSI since it's disabled in the Expo plugin configuration
          jsi: false,
          // Use proper schemaMigrations() - required by WatermelonDB
          migrations,
          // Database name for development debugging
          ...(__DEV__ && { dbName: 'GrmWatermelonDatabase' }),
        });

        // Create the database instance
        this.database = new Database({
          adapter,
          modelClasses,
          actionsEnabled: true, // Enable actions for better debugging
        });

        this.isInitialized = true;
        console.log('✅ WatermelonDB initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing WatermelonDB:', error);
        throw error;
      }
    }
    return this.database;
  }

  /**
   * Get the database instance (with lazy initialization)
   */
  getDatabase() {
    return this._initializeDatabase();
  }

  /**
   * Issues Management
   */
  async getIssues(filters = {}) {
    try {
      const db = this.getDatabase();
      const issuesCollection = db.get('grm_issues');
      let query = issuesCollection.query();

      // Apply filters
      const queryFilters = [];

      if (filters.project_id) {
        queryFilters.push(Q.where('project_id', filters.project_id));
      }

      if (filters.status_id) {
        queryFilters.push(Q.where('status_id', filters.status_id));
      }

      if (filters.category_id) {
        queryFilters.push(Q.where('category_id', filters.category_id));
      }

      if (filters.assignee_id) {
        queryFilters.push(Q.where('assignee_id', filters.assignee_id));
      }

      if (filters.reporter_id) {
        queryFilters.push(Q.where('reporter_id', filters.reporter_id));
      }

      if (filters.administrative_region_id) {
        queryFilters.push(Q.where('administrative_region_id', filters.administrative_region_id));
      }

      // Date range filters
      if (filters.from_date) {
        queryFilters.push(Q.where('issue_date', Q.gte(new Date(filters.from_date).getTime())));
      }

      if (filters.to_date) {
        queryFilters.push(Q.where('issue_date', Q.lte(new Date(filters.to_date).getTime())));
      }

      if (queryFilters.length > 0) {
        query = issuesCollection.query(...queryFilters);
      }

      // Add sorting
      query = query.sortBy('issue_date', Q.desc);

      const issues = await query.fetch();
      // Return raw data directly - no transformation
      return issues
        .filter((issue) => issue && issue._raw) // Filter out null issues
        .map((issue) => ({
          ...issue._raw,
          // Ensure name field exists (Frappe primary identifier)
          name: issue._raw.id || issue._raw.name,
        }))
        .filter((issue) => issue !== null);
    } catch (error) {
      console.error('Error fetching issues from WatermelonDB:', error);
      return [];
    }
  }

  async getIssue(issueId) {
    try {
      console.log('🔍 [WM] getIssue called with ID:', issueId);

      const db = this.getDatabase();
      console.log('🔍 [WM] Database instance obtained for getIssue');

      const issue = await db.get('grm_issues').find(issueId);
      console.log('🔍 [WM] Issue found:', !!issue);

      if (issue) {
        console.log('🔍 [WM] Issue details:', {
          id: issue.id,
          _raw: issue._raw,
          _status: issue._status,
        });

        // Return raw data directly - no transformation
        const result = {
          ...issue._raw,
          name: issue._raw.id || issue._raw.name,
        };

        console.log('✅ [WM] Returning found issue:', result);
        return result;
      } else {
        console.log('❌ [WM] Issue not found for ID:', issueId);
        return null;
      }
    } catch (error) {
      console.error('❌ [WM] Error fetching issue from WatermelonDB:', error);
      console.error('❌ [WM] Error stack:', error.stack);
      return null;
    }
  }

  async createIssue(issueData) {
    try {
      console.log('🔍 [WM] createIssue called with data:', issueData);

      const db = this.getDatabase();
      console.log('🔍 [WM] Database instance obtained');

      const issue = await db.write(async () => {
        console.log('🔍 [WM] Starting database write transaction');

        return await db.get('grm_issues').create((issue) => {
          console.log('🔍 [WM] Creating new issue record');

          this._mapIssueDataToModel(issue, issueData);
          issue.createdAt = new Date();
          issue.updatedAt = new Date();

          console.log('🔍 [WM] Issue record created with ID:', issue.id);
          console.log('🔍 [WM] Issue _raw data:', issue._raw);
        });
      });

      console.log('🔍 [WM] Database write transaction completed');
      console.log('🔍 [WM] Created issue object:', issue);
      console.log('🔍 [WM] Issue ID:', issue.id);
      console.log('🔍 [WM] Issue _raw:', issue._raw);

      // Return raw data directly - no transformation
      const result = {
        ...issue._raw,
        name: issue._raw.id || issue._raw.name,
      };

      console.log('✅ [WM] Returning issue result:', result);
      return result;
    } catch (error) {
      console.error('❌ [WM] Error creating issue in WatermelonDB:', error);
      console.error('❌ [WM] Error stack:', error.stack);
      throw error;
    }
  }

  async updateIssue(issueId, updateData) {
    try {
      const db = this.getDatabase();
      const updatedIssue = await db.write(async () => {
        const issue = await db.get('grm_issues').find(issueId);
        return await issue.update((issue) => {
          this._mapIssueDataToModel(issue, updateData);
          issue.updatedAt = new Date();
        });
      });

      // Return raw data directly - no transformation
      return {
        ...updatedIssue._raw,
        name: updatedIssue._raw.id || updatedIssue._raw.name,
      };
    } catch (error) {
      console.error('Error updating issue in WatermelonDB:', error);
      throw error;
    }
  }

  async deleteIssue(issueId) {
    try {
      const db = this.getDatabase();
      await db.write(async () => {
        const issue = await db.get('grm_issues').find(issueId);
        await issue.markAsDeleted();
      });

      return { status: 'success', message: 'Issue deleted successfully' };
    } catch (error) {
      console.error('Error deleting issue from WatermelonDB:', error);
      throw error;
    }
  }

  /**
   * Lookup Data Methods - Return raw Frappe data directly
   */
  async getIssueStatuses() {
    try {
      const db = this.getDatabase();
      const statuses = await db.get('grm_issue_statuses').query().fetch();
      // Return raw data directly - no transformation
      return statuses
        .filter((status) => status && status._raw)
        .map((status) => ({
          ...status._raw,
          name: status._raw.id || status._raw.name,
        }))
        .filter((status) => status !== null);
    } catch (error) {
      console.error('Error fetching statuses from WatermelonDB:', error);
      return [];
    }
  }

  async getIssueCategories(projectId = null) {
    try {
      const db = this.getDatabase();
      let query = db.get('grm_issue_categories').query();

      // Note: Categories don't have direct project filtering in the schema
      // This would need to be implemented through relationships if needed

      const categories = await query.fetch();
      // Return raw data directly - no transformation
      return categories
        .filter((category) => category && category._raw)
        .map((category) => ({
          ...category._raw,
          name: category._raw.id || category._raw.name,
        }))
        .filter((category) => category !== null);
    } catch (error) {
      console.error('Error fetching categories from WatermelonDB:', error);
      return [];
    }
  }

  async getIssueTypes(projectId = null) {
    try {
      const db = this.getDatabase();
      const types = await db.get('grm_issue_types').query().fetch();
      // Return raw data directly - no transformation
      return types
        .filter((type) => type && type._raw)
        .map((type) => ({
          ...type._raw,
          name: type._raw.id || type._raw.name,
        }))
        .filter((type) => type !== null);
    } catch (error) {
      console.error('Error fetching types from WatermelonDB:', error);
      return [];
    }
  }

  async getAgeGroups() {
    try {
      const db = this.getDatabase();
      const ageGroups = await db.get('grm_issue_age_groups').query().fetch();
      // Return raw data directly - no transformation
      return ageGroups
        .filter((ageGroup) => ageGroup && ageGroup._raw)
        .map((ageGroup) => ({
          ...ageGroup._raw,
          name: ageGroup._raw.id || ageGroup._raw.name,
        }))
        .filter((ageGroup) => ageGroup !== null);
    } catch (error) {
      console.error('Error fetching age groups from WatermelonDB:', error);
      return [];
    }
  }

  async getCitizenGroups() {
    try {
      const db = this.getDatabase();
      const citizenGroups = await db.get('grm_issue_citizen_groups').query().fetch();
      // Return raw data directly - no transformation
      return citizenGroups
        .filter((group) => group && group._raw)
        .map((group) => ({
          ...group._raw,
          name: group._raw.id || group._raw.name,
        }))
        .filter((group) => group !== null);
    } catch (error) {
      console.error('Error fetching citizen groups from WatermelonDB:', error);
      return [];
    }
  }

  async getDepartments() {
    try {
      const db = this.getDatabase();
      const departments = await db.get('grm_issue_departments').query().fetch();
      // Return raw data directly - no transformation
      return departments
        .filter((dept) => dept && dept._raw)
        .map((dept) => ({
          ...dept._raw,
          name: dept._raw.id || dept._raw.name,
        }))
        .filter((dept) => dept !== null);
    } catch (error) {
      console.error('Error fetching departments from WatermelonDB:', error);
      return [];
    }
  }

  async getProjects() {
    try {
      const db = this.getDatabase();

      // Add a small delay to prevent race conditions during sync
      if (this.syncInProgress) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const projects = await db.get('grm_projects').query().fetch();

      console.log(`🔍 [PROJECTS] Found ${projects.length} project records in database`);

      // Enhanced filtering with detailed logging
      const validProjects = projects.filter((project, index) => {
        if (!project) {
          console.warn(`🔍 [PROJECTS] Record ${index} is null`);
          return false;
        }

        if (!project._raw) {
          console.warn(`🔍 [PROJECTS] Record ${index} has no _raw data:`, project);
          return false;
        }

        // Additional validation for critical fields
        const rawData = project._raw;
        if (!rawData.id && !rawData.name && !rawData.project_code) {
          console.warn(`🔍 [PROJECTS] Record ${index} has no valid identifier:`, rawData);
          return false;
        }

        return true;
      });

      console.log(`🔍 [PROJECTS] ${validProjects.length} valid project records after filtering`);

      // Return raw data directly - no transformation
      const transformedProjects = validProjects
        .map((project, index) => {
          try {
            return {
              ...project._raw,
              name: project._raw.id || project._raw.name,
            };
          } catch (error) {
            console.error(`🔍 [PROJECTS] Error processing record ${index}:`, error);
            return null;
          }
        })
        .filter((project) => project !== null);

      console.log(`🔍 [PROJECTS] ${transformedProjects.length} projects successfully processed`);

      return transformedProjects;
    } catch (error) {
      console.error('Error fetching projects from WatermelonDB:', error);
      return [];
    }
  }

  async getAdministrativeRegions(filters = {}) {
    try {
      const db = this.getDatabase();
      let query = db.get('grm_administrative_regions').query();

      const queryFilters = [];

      if (filters.project_id) {
        queryFilters.push(Q.where('project_id', filters.project_id));
      }

      if (filters.parent_region_id) {
        queryFilters.push(Q.where('parent_region_id', filters.parent_region_id));
      }

      if (filters.administrative_level_id) {
        queryFilters.push(Q.where('administrative_level_id', filters.administrative_level_id));
      }

      if (queryFilters.length > 0) {
        query = db.get('grm_administrative_regions').query(...queryFilters);
      }

      const regions = await query.fetch();
      // Return raw data directly - no transformation
      return regions
        .filter((region) => region && region._raw)
        .map((region) => ({
          ...region._raw,
          name: region._raw.id || region._raw.name,
        }))
        .filter((region) => region !== null);
    } catch (error) {
      console.error('Error fetching regions from WatermelonDB:', error);
      return [];
    }
  }

  /**
   * Sync Methods - Bulk operations for data synchronization
   */
  async bulkUpsertIssues(issues) {
    try {
      const db = this.getDatabase();
      await db.write(async () => {
        const issuesCollection = db.get('grm_issues');

        for (const issueData of issues) {
          try {
            // Try to find existing record
            const existingIssue = await issuesCollection.find(issueData.name);

            // Update existing record
            await existingIssue.update((issue) => {
              this.updateIssueFromServerData(issue, issueData);
            });
          } catch (error) {
            // Record doesn't exist, create new one
            await issuesCollection.create((issue) => {
              issue._raw.id = issueData.name; // Set the server ID
              this.updateIssueFromServerData(issue, issueData);
            });
          }
        }
      });
    } catch (error) {
      console.error('Error bulk upserting issues:', error);
      throw error;
    }
  }

  async bulkUpsertLookupData(tableName, data) {
    try {
      // Set sync flag to prevent race conditions
      this.syncInProgress = true;

      const db = this.getDatabase();

      // Validate inputs
      if (!tableName || !data || !Array.isArray(data)) {
        console.warn(
          `Invalid input for bulkUpsertLookupData: tableName=${tableName}, data length=${data?.length}`
        );
        return;
      }

      if (data.length === 0) {
        console.log(`No data to upsert for table: ${tableName}`);
        return;
      }

      await db.write(async () => {
        const collection = db.get(tableName);

        // Validate collection exists
        if (!collection) {
          console.error(`Collection '${tableName}' not found in database`);
          return;
        }

        for (const item of data) {
          // For Frappe data, use .name as the primary identifier
          const itemId = item.name;

          // Additional validation for critical fields
          if (!itemId || itemId === 'unknown') {
            console.warn(`Skipping item with invalid ID in ${tableName}:`, item);
            continue;
          }

          try {
            // Try to find existing record
            const existingRecord = await collection.find(itemId);

            // Update existing record with raw Frappe data
            await existingRecord.update((record) => {
              this.updateRecordFromFrappeData(record, item, tableName);
            });
          } catch (error) {
            // Record doesn't exist, create new one
            try {
              await collection.create((record) => {
                record._raw.id = itemId; // Set the Frappe name as ID
                this.updateRecordFromFrappeData(record, item, tableName);
              });
            } catch (createError) {
              console.error(`Error creating record in ${tableName}:`, createError, 'Item:', item);
            }
          }
        }
      });

      console.log(`✅ Stored ${data.length} ${tableName} records in WatermelonDB`);
    } catch (error) {
      console.error(`Error bulk upserting ${tableName}:`, error);
      throw error;
    } finally {
      // Always clear sync flag
      this.syncInProgress = false;
    }
  }

  /**
   * Reactive Query Methods for UI Components
   */
  observeIssues(filters = {}) {
    try {
      const db = this.getDatabase();
      const issuesCollection = db.get('grm_issues');
      let query = issuesCollection.query();

      // Apply filters similar to getIssues
      const queryFilters = [];

      if (filters.project_id) {
        queryFilters.push(Q.where('project_id', filters.project_id));
      }

      if (filters.status_id) {
        queryFilters.push(Q.where('status_id', filters.status_id));
      }

      if (filters.category_id) {
        queryFilters.push(Q.where('category_id', filters.category_id));
      }

      if (filters.assignee_id) {
        queryFilters.push(Q.where('assignee_id', filters.assignee_id));
      }

      if (filters.reporter_id) {
        queryFilters.push(Q.where('reporter_id', filters.reporter_id));
      }

      if (filters.administrative_region_id) {
        queryFilters.push(Q.where('administrative_region_id', filters.administrative_region_id));
      }

      if (queryFilters.length > 0) {
        query = issuesCollection.query(...queryFilters);
      }

      query = query.sortBy('issue_date', Q.desc);

      return query.observe();
    } catch (error) {
      console.error('Error creating observable issues query:', error);
      // Return empty observable
      return { subscribe: () => ({ unsubscribe: () => {} }) };
    }
  }

  observeIssueStatuses() {
    try {
      const db = this.getDatabase();
      return db.get('grm_issue_statuses').query().observe();
    } catch (error) {
      console.error('Error creating observable statuses query:', error);
      // Return empty observable
      return { subscribe: () => ({ unsubscribe: () => {} }) };
    }
  }

  /**
   * Helper method to map issue data to model
   */
  _mapIssueDataToModel(issue, data) {
    if (data.project_id !== undefined) issue.projectId = data.project_id;
    if (data.issue_date !== undefined) issue.issueDate = new Date(data.issue_date || Date.now());
    if (data.intake_date !== undefined) issue.intakeDate = new Date(data.intake_date || Date.now());
    if (data.category_id !== undefined) issue.categoryId = data.category_id;
    if (data.issue_type_id !== undefined) issue.issueTypeId = data.issue_type_id;
    if (data.status_id !== undefined) issue.statusId = data.status_id;
    if (data.tracking_code !== undefined) issue.trackingCode = data.tracking_code;
    if (data.description !== undefined) issue.description = data.description;
    if (data.issue_location !== undefined) issue.issueLocation = data.issue_location;
    if (data.citizen_type !== undefined) issue.citizenType = data.citizen_type;
    if (data.citizen !== undefined) issue.citizen = data.citizen;
    if (data.citizen_confidential !== undefined)
      issue.citizenConfidential = data.citizen_confidential;
    if (data.gender !== undefined) issue.gender = data.gender;
    if (data.contact_medium !== undefined) issue.contactMedium = data.contact_medium;
    if (data.contact_info_type !== undefined) issue.contactInfoType = data.contact_info_type;
    if (data.contact_information !== undefined) issue.contactInformation = data.contact_information;
    if (data.contact_info_confidential !== undefined)
      issue.contactInfoConfidential = data.contact_info_confidential;
    if (data.citizen_age_group_id !== undefined)
      issue.citizenAgeGroupId = data.citizen_age_group_id;
    if (data.citizen_group_1_id !== undefined) issue.citizenGroup1Id = data.citizen_group_1_id;
    if (data.citizen_group_2_id !== undefined) issue.citizenGroup2Id = data.citizen_group_2_id;
    if (data.reporter_id !== undefined) issue.reporterId = data.reporter_id;
    if (data.assignee_id !== undefined) issue.assigneeId = data.assignee_id;
    if (data.administrative_region_id !== undefined)
      issue.administrativeRegionId = data.administrative_region_id;
    if (data.resolution_days !== undefined) issue.resolutionDays = data.resolution_days;
    if (data.resolution_date !== undefined)
      issue.resolutionDate = data.resolution_date ? new Date(data.resolution_date) : null;
    if (data.resolution_accepted !== undefined) issue.resolutionAccepted = data.resolution_accepted;
    if (data.rating !== undefined) issue.rating = data.rating;
    if (data.escalate_flag !== undefined) issue.escalateFlag = data.escalate_flag || false;
    if (data.confirmed !== undefined) issue.confirmed = data.confirmed || false;
    if (data.amended_from_id !== undefined) issue.amendedFromId = data.amended_from_id;
  }

  /**
   * Helper method to update records from raw Frappe data
   * No data transformation - store Frappe data directly
   */
  updateRecordFromFrappeData(record, frappeData, tableName) {
    const now = new Date();

    // Store all Frappe fields directly based on table type
    switch (tableName) {
      case 'grm_issue_statuses':
        record.statusName = frappeData.status_name || '';
        record.finalStatus = frappeData.final_status || false;
        record.initialStatus = frappeData.initial_status || false;
        record.rejectedStatus = frappeData.rejected_status || false;
        record.openStatus = frappeData.open_status || false;
        break;

      case 'grm_issue_categories':
        record.categoryName = frappeData.category_name || '';
        record.label = frappeData.label || '';
        record.abbreviation = frappeData.abbreviation || '';
        record.assignedDepartmentId = frappeData.assigned_department_id || '';
        record.assignedAppealDepartmentId = frappeData.assigned_appeal_department_id || '';
        record.assignedEscalationDepartmentId = frappeData.assigned_escalation_department_id || '';
        record.confidentialityLevel = frappeData.confidentiality_level || '';
        record.redirectionProtocol = frappeData.redirection_protocol || '';
        record.administrativeLevelId = frappeData.administrative_level_id || '';
        break;

      case 'grm_issue_types':
        record.typeName = frappeData.type_name || '';
        break;

      case 'grm_issue_age_groups':
        record.ageGroup = frappeData.age_group_name || '';
        break;

      case 'grm_issue_citizen_groups':
        record.groupName = frappeData.group_name || '';
        record.groupType = frappeData.group_type || '';
        break;

      case 'grm_issue_departments':
        record.departmentName = frappeData.department_name || '';
        record.headId = frappeData.head_id || '';
        break;

      case 'grm_projects':
        record.title = frappeData.title || '';
        record.projectCode = frappeData.project_code || '';
        record.description = frappeData.description || '';
        record.startDate = frappeData.start_date ? new Date(frappeData.start_date) : null;
        record.endDate = frappeData.end_date ? new Date(frappeData.end_date) : null;
        record.isActive = frappeData.is_active || false;
        record.logo = frappeData.logo || '';
        record.defaultLanguage = frappeData.default_language || '';
        record.autoEscalationDays = frappeData.auto_escalation_days || 0;
        record.enableCitizenFeedback = frappeData.enable_citizen_feedback || false;
        break;

      case 'grm_administrative_regions':
        record.regionName = frappeData.region_name || '';
        record.administrativeLevelId = frappeData.administrative_level_id || '';
        record.parentRegionId = frappeData.parent_region_id || '';
        record.location = frappeData.location || '';
        record.projectId = frappeData.project_id || '';
        record.path = frappeData.path || '';
        break;
    }

    record.createdAt = frappeData.creation ? new Date(frappeData.creation) : now;
    record.updatedAt = frappeData.modified ? new Date(frappeData.modified) : now;
  }

  updateIssueFromServerData(issue, serverData) {
    this._mapIssueDataToModel(issue, serverData);
    issue.createdAt = serverData.creation ? new Date(serverData.creation) : new Date();
    issue.updatedAt = serverData.modified ? new Date(serverData.modified) : new Date();
  }

  updateLookupFromServerData(record, serverData, tableName) {
    // Delegate to the new unified method
    this.updateRecordFromFrappeData(record, serverData, tableName);
  }

  /**
   * Clear all data (for testing/development)
   */
  async clearAllData() {
    try {
      const db = this.getDatabase();
      await db.write(async () => {
        await db.unsafeResetDatabase();
      });
      console.log('WatermelonDB database cleared successfully');
    } catch (error) {
      console.error('Error clearing WatermelonDB database:', error);
      throw error;
    }
  }

  /**
   * User Context Management
   */
  async storeUserContext(userId, contextData) {
    try {
      const db = this.getDatabase();
      const now = new Date();

      await db.write(async () => {
        const userContextCollection = db.get('user_context');

        try {
          // Try to find existing user context
          const existingContext = await userContextCollection.find(userId);

          // Update existing context
          await existingContext.update((context) => {
            context.contextData = JSON.stringify(contextData);
            context.accessibleProjects = JSON.stringify(contextData.accessible_projects || []);
            context.accessibleRegions = JSON.stringify(contextData.accessible_regions || []);
            context.assignments = JSON.stringify(contextData.assignments || []);
            context.permissions = JSON.stringify(contextData.permissions || {});
            context.lastUpdated = now;
            context.updatedAt = now;
          });

          console.log('✅ User context updated successfully');
        } catch (error) {
          // Context doesn't exist, create new one
          await userContextCollection.create((context) => {
            context._raw.id = userId; // Use userId as the record ID
            context.userId = userId;
            context.contextData = JSON.stringify(contextData);
            context.accessibleProjects = JSON.stringify(contextData.accessible_projects || []);
            context.accessibleRegions = JSON.stringify(contextData.accessible_regions || []);
            context.assignments = JSON.stringify(contextData.assignments || []);
            context.permissions = JSON.stringify(contextData.permissions || {});
            context.lastUpdated = now;
            context.createdAt = now;
            context.updatedAt = now;
          });

          console.log('✅ User context created successfully');
        }
      });

      return true;
    } catch (error) {
      console.error('❌ Error storing user context:', error);
      throw error;
    }
  }

  async getUserContext(userId) {
    try {
      const db = this.getDatabase();
      const userContext = await db.get('user_context').find(userId);

      return {
        ...userContext.getContextData(),
        accessible_projects: userContext.getAccessibleProjects(),
        accessible_regions: userContext.getAccessibleRegions(),
        assignments: userContext.getAssignments(),
        permissions: userContext.getPermissions(),
        last_updated: userContext.lastUpdated,
      };
    } catch (error) {
      console.warn('⚠️ User context not found or error loading:', error.message);
      return null;
    }
  }

  async clearUserContext(userId) {
    try {
      const db = this.getDatabase();
      await db.write(async () => {
        const userContext = await db.get('user_context').find(userId);
        await userContext.markAsDeleted();
      });

      console.log('✅ User context cleared successfully');
      return true;
    } catch (error) {
      console.warn('⚠️ Error clearing user context (may not exist):', error.message);
      return false;
    }
  }
}

// Create and export singleton instance
const watermelonManager = new WatermelonManager();
export default watermelonManager;

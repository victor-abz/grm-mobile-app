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
    this.isInitialized = false;
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
      return issues
        .filter((issue) => issue && issue._raw) // Filter out null issues
        .map((issue) => this.transformIssueToApiFormat(issue._raw))
        .filter((issue) => issue !== null); // Filter out null transform results
    } catch (error) {
      console.error('Error fetching issues from WatermelonDB:', error);
      return [];
    }
  }

  async getIssue(issueId) {
    try {
      const db = this.getDatabase();
      const issue = await db.get('grm_issues').find(issueId);
      return this.transformIssueToApiFormat(issue._raw);
    } catch (error) {
      console.error('Error fetching issue from WatermelonDB:', error);
      return null;
    }
  }

  async createIssue(issueData) {
    try {
      const db = this.getDatabase();
      const issue = await db.write(async () => {
        return await db.get('grm_issues').create((issue) => {
          this._mapIssueDataToModel(issue, issueData);
          issue.createdAt = new Date();
          issue.updatedAt = new Date();
        });
      });

      return this.transformIssueToApiFormat(issue._raw);
    } catch (error) {
      console.error('Error creating issue in WatermelonDB:', error);
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

      return this.transformIssueToApiFormat(updatedIssue._raw);
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
   * Lookup Data Methods
   */
  async getIssueStatuses() {
    try {
      const db = this.getDatabase();
      const statuses = await db.get('grm_issue_statuses').query().fetch();
      return statuses
        .filter((status) => status && status._raw) // Filter out null records
        .map((status) => this.transformStatusToApiFormat(status._raw))
        .filter((status) => status !== null); // Filter out null transform results
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
      return categories
        .filter((category) => category && category._raw) // Filter out null records
        .map((category) => this.transformCategoryToApiFormat(category._raw))
        .filter((category) => category !== null); // Filter out null transform results
    } catch (error) {
      console.error('Error fetching categories from WatermelonDB:', error);
      return [];
    }
  }

  async getIssueTypes(projectId = null) {
    try {
      const db = this.getDatabase();
      const types = await db.get('grm_issue_types').query().fetch();
      return types
        .filter((type) => type && type._raw) // Filter out null records
        .map((type) => this.transformTypeToApiFormat(type._raw))
        .filter((type) => type !== null); // Filter out null transform results
    } catch (error) {
      console.error('Error fetching types from WatermelonDB:', error);
      return [];
    }
  }

  async getAgeGroups() {
    try {
      const db = this.getDatabase();
      const ageGroups = await db.get('grm_issue_age_groups').query().fetch();
      return ageGroups
        .filter((ageGroup) => ageGroup && ageGroup._raw) // Filter out null records
        .map((ageGroup) => this.transformAgeGroupToApiFormat(ageGroup._raw))
        .filter((ageGroup) => ageGroup !== null); // Filter out null transform results
    } catch (error) {
      console.error('Error fetching age groups from WatermelonDB:', error);
      return [];
    }
  }

  async getCitizenGroups() {
    try {
      const db = this.getDatabase();
      const citizenGroups = await db.get('grm_issue_citizen_groups').query().fetch();
      return citizenGroups
        .filter((group) => group && group._raw) // Filter out null records
        .map((group) => this.transformCitizenGroupToApiFormat(group._raw))
        .filter((group) => group !== null); // Filter out null transform results
    } catch (error) {
      console.error('Error fetching citizen groups from WatermelonDB:', error);
      return [];
    }
  }

  async getDepartments() {
    try {
      const db = this.getDatabase();
      const departments = await db.get('grm_issue_departments').query().fetch();
      return departments
        .filter((dept) => dept && dept._raw) // Filter out null records
        .map((dept) => this.transformDepartmentToApiFormat(dept._raw))
        .filter((dept) => dept !== null); // Filter out null transform results
    } catch (error) {
      console.error('Error fetching departments from WatermelonDB:', error);
      return [];
    }
  }

  async getProjects() {
    try {
      const db = this.getDatabase();
      const projects = await db.get('grm_projects').query().fetch();
      return projects
        .filter((project) => project && project._raw) // Filter out null projects
        .map((project) => this.transformProjectToApiFormat(project._raw))
        .filter((project) => project !== null); // Filter out null transform results
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
      return regions
        .filter((region) => region && region._raw) // Filter out null records
        .map((region) => this.transformRegionToApiFormat(region._raw))
        .filter((region) => region !== null); // Filter out null transform results
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
          // Validate item has required fields - for Frappe data, the ID is usually in .name
          if (!item || (!item.name && !item.id)) {
            console.warn(`Skipping item without ID/name in ${tableName}:`, item);
            continue;
          }

          // For Frappe data, use .name as the primary identifier, fallback to .id
          const itemId = item.name || item.id;

          // Additional validation for critical fields
          if (!itemId || itemId === 'unknown') {
            console.warn(`Skipping item with invalid ID in ${tableName}:`, item);
            continue;
          }

          try {
            // Try to find existing record
            const existingRecord = await collection.find(itemId);

            // Update existing record
            await existingRecord.update((record) => {
              this.updateLookupFromServerData(record, item, tableName);
            });
          } catch (error) {
            // Record doesn't exist, create new one
            try {
              await collection.create((record) => {
                record._raw.id = itemId; // Set the server ID
                this.updateLookupFromServerData(record, item, tableName);
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
   * Data Transformation Methods
   * Convert WatermelonDB raw data to API format (keeping backend structure)
   */
  transformIssueToApiFormat(rawIssue) {
    if (!rawIssue) {
      console.warn('transformIssueToApiFormat: rawIssue is null or undefined');
      return null;
    }

    return {
      name: rawIssue.id || rawIssue.name || 'unknown',
      project_id: rawIssue.project_id,
      issue_date: rawIssue.issue_date ? new Date(rawIssue.issue_date).toISOString() : null,
      intake_date: rawIssue.intake_date ? new Date(rawIssue.intake_date).toISOString() : null,
      category_id: rawIssue.category_id,
      issue_type_id: rawIssue.issue_type_id,
      status_id: rawIssue.status_id,
      tracking_code: rawIssue.tracking_code,
      description: rawIssue.description,
      issue_location: rawIssue.issue_location,
      citizen_type: rawIssue.citizen_type,
      citizen: rawIssue.citizen,
      citizen_confidential: rawIssue.citizen_confidential,
      gender: rawIssue.gender,
      contact_medium: rawIssue.contact_medium,
      contact_info_type: rawIssue.contact_info_type,
      contact_information: rawIssue.contact_information,
      contact_info_confidential: rawIssue.contact_info_confidential,
      citizen_age_group_id: rawIssue.citizen_age_group_id,
      citizen_group_1_id: rawIssue.citizen_group_1_id,
      citizen_group_2_id: rawIssue.citizen_group_2_id,
      reporter_id: rawIssue.reporter_id,
      assignee_id: rawIssue.assignee_id,
      administrative_region_id: rawIssue.administrative_region_id,
      resolution_days: rawIssue.resolution_days,
      resolution_date: rawIssue.resolution_date
        ? new Date(rawIssue.resolution_date).toISOString()
        : null,
      resolution_accepted: rawIssue.resolution_accepted,
      rating: rawIssue.rating,
      escalate_flag: rawIssue.escalate_flag,
      confirmed: rawIssue.confirmed,
      amended_from_id: rawIssue.amended_from_id,
      creation: rawIssue.created_at ? new Date(rawIssue.created_at).toISOString() : null,
      modified: rawIssue.updated_at ? new Date(rawIssue.updated_at).toISOString() : null,
    };
  }

  transformStatusToApiFormat(rawStatus) {
    if (!rawStatus) {
      console.warn('transformStatusToApiFormat: rawStatus is null or undefined');
      return null;
    }

    return {
      name: rawStatus.id || rawStatus.name || 'unknown',
      status_name: rawStatus.status_name,
      final_status: rawStatus.final_status,
      initial_status: rawStatus.initial_status,
      rejected_status: rawStatus.rejected_status,
      open_status: rawStatus.open_status,
      creation: rawStatus.created_at ? new Date(rawStatus.created_at).toISOString() : null,
      modified: rawStatus.updated_at ? new Date(rawStatus.updated_at).toISOString() : null,
    };
  }

  transformCategoryToApiFormat(rawCategory) {
    if (!rawCategory) {
      console.warn('transformCategoryToApiFormat: rawCategory is null or undefined');
      return null;
    }

    return {
      name: rawCategory.id || rawCategory.name || 'unknown',
      category_name: rawCategory.category_name,
      label: rawCategory.label,
      abbreviation: rawCategory.abbreviation,
      assigned_department_id: rawCategory.assigned_department_id,
      assigned_appeal_department_id: rawCategory.assigned_appeal_department_id,
      assigned_escalation_department_id: rawCategory.assigned_escalation_department_id,
      confidentiality_level: rawCategory.confidentiality_level,
      redirection_protocol: rawCategory.redirection_protocol,
      administrative_level_id: rawCategory.administrative_level_id,
      creation: rawCategory.created_at ? new Date(rawCategory.created_at).toISOString() : null,
      modified: rawCategory.updated_at ? new Date(rawCategory.updated_at).toISOString() : null,
    };
  }

  transformTypeToApiFormat(rawType) {
    if (!rawType) {
      console.warn('transformTypeToApiFormat: rawType is null or undefined');
      return null;
    }

    return {
      name: rawType.id || rawType.name || 'unknown',
      type_name: rawType.type_name,
      creation: rawType.created_at ? new Date(rawType.created_at).toISOString() : null,
      modified: rawType.updated_at ? new Date(rawType.updated_at).toISOString() : null,
    };
  }

  transformAgeGroupToApiFormat(rawAgeGroup) {
    if (!rawAgeGroup) {
      console.warn('transformAgeGroupToApiFormat: rawAgeGroup is null or undefined');
      return null;
    }

    return {
      name: rawAgeGroup.id || rawAgeGroup.name || 'unknown',
      age_group: rawAgeGroup.age_group,
      creation: rawAgeGroup.created_at ? new Date(rawAgeGroup.created_at).toISOString() : null,
      modified: rawAgeGroup.updated_at ? new Date(rawAgeGroup.updated_at).toISOString() : null,
    };
  }

  transformCitizenGroupToApiFormat(rawGroup) {
    if (!rawGroup) {
      console.warn('transformCitizenGroupToApiFormat: rawGroup is null or undefined');
      return null;
    }

    return {
      name: rawGroup.id || rawGroup.name || 'unknown',
      group_name: rawGroup.group_name,
      group_type: rawGroup.group_type,
      creation: rawGroup.created_at ? new Date(rawGroup.created_at).toISOString() : null,
      modified: rawGroup.updated_at ? new Date(rawGroup.updated_at).toISOString() : null,
    };
  }

  transformDepartmentToApiFormat(rawDept) {
    if (!rawDept) {
      console.warn('transformDepartmentToApiFormat: rawDept is null or undefined');
      return null;
    }

    return {
      name: rawDept.id || rawDept.name || 'unknown',
      department_name: rawDept.department_name,
      head_id: rawDept.head_id,
      creation: rawDept.created_at ? new Date(rawDept.created_at).toISOString() : null,
      modified: rawDept.updated_at ? new Date(rawDept.updated_at).toISOString() : null,
    };
  }

  transformProjectToApiFormat(rawProject) {
    if (!rawProject) {
      console.warn('transformProjectToApiFormat: rawProject is null or undefined');
      return null;
    }

    return {
      name: rawProject.id || rawProject.name || 'unknown',
      title: rawProject.title,
      project_code: rawProject.project_code,
      description: rawProject.description,
      start_date: rawProject.start_date ? new Date(rawProject.start_date).toISOString() : null,
      end_date: rawProject.end_date ? new Date(rawProject.end_date).toISOString() : null,
      is_active: rawProject.is_active,
      logo: rawProject.logo,
      default_language: rawProject.default_language,
      auto_escalation_days: rawProject.auto_escalation_days,
      enable_citizen_feedback: rawProject.enable_citizen_feedback,
      creation: rawProject.created_at ? new Date(rawProject.created_at).toISOString() : null,
      modified: rawProject.updated_at ? new Date(rawProject.updated_at).toISOString() : null,
    };
  }

  transformRegionToApiFormat(rawRegion) {
    if (!rawRegion) {
      console.warn('transformRegionToApiFormat: rawRegion is null or undefined');
      return null;
    }

    return {
      name: rawRegion.id || rawRegion.name || 'unknown',
      region_name: rawRegion.region_name,
      administrative_level_id: rawRegion.administrative_level_id,
      parent_region_id: rawRegion.parent_region_id,
      location: rawRegion.location,
      project_id: rawRegion.project_id,
      path: rawRegion.path,
      creation: rawRegion.created_at ? new Date(rawRegion.created_at).toISOString() : null,
      modified: rawRegion.updated_at ? new Date(rawRegion.updated_at).toISOString() : null,
    };
  }

  /**
   * Helper methods for updating records from server data
   */
  updateIssueFromServerData(issue, serverData) {
    this._mapIssueDataToModel(issue, serverData);
    issue.createdAt = serverData.creation ? new Date(serverData.creation) : new Date();
    issue.updatedAt = serverData.modified ? new Date(serverData.modified) : new Date();
  }

  updateLookupFromServerData(record, serverData, tableName) {
    const now = new Date();

    switch (tableName) {
      case 'grm_issue_statuses':
        record.statusName = serverData.status_name;
        record.finalStatus = serverData.final_status || false;
        record.initialStatus = serverData.initial_status || false;
        record.rejectedStatus = serverData.rejected_status || false;
        record.openStatus = serverData.open_status || false;
        break;

      case 'grm_issue_categories':
        record.categoryName = serverData.category_name;
        record.label = serverData.label;
        record.abbreviation = serverData.abbreviation;
        record.assignedDepartmentId = serverData.assigned_department_id;
        record.assignedAppealDepartmentId = serverData.assigned_appeal_department_id;
        record.assignedEscalationDepartmentId = serverData.assigned_escalation_department_id;
        record.confidentialityLevel = serverData.confidentiality_level;
        record.redirectionProtocol = serverData.redirection_protocol;
        record.administrativeLevelId = serverData.administrative_level_id;
        break;

      case 'grm_issue_types':
        record.typeName = serverData.type_name;
        break;

      case 'grm_issue_age_groups':
        record.ageGroup = serverData.age_group;
        break;

      case 'grm_issue_citizen_groups':
        record.groupName = serverData.group_name;
        record.groupType = serverData.group_type;
        break;

      case 'grm_issue_departments':
        record.departmentName = serverData.department_name;
        record.headId = serverData.head_id;
        break;

      case 'grm_projects':
        record.title = serverData.title;
        record.projectCode = serverData.project_code;
        record.description = serverData.description;
        record.startDate = serverData.start_date ? new Date(serverData.start_date) : null;
        record.endDate = serverData.end_date ? new Date(serverData.end_date) : null;
        record.isActive = serverData.is_active || false;
        record.logo = serverData.logo;
        record.defaultLanguage = serverData.default_language;
        record.autoEscalationDays = serverData.auto_escalation_days;
        record.enableCitizenFeedback = serverData.enable_citizen_feedback || false;
        break;

      case 'grm_administrative_regions':
        record.regionName = serverData.region_name;
        record.administrativeLevelId = serverData.administrative_level_id;
        record.parentRegionId = serverData.parent_region_id;
        record.location = serverData.location;
        record.projectId = serverData.project_id;
        record.path = serverData.path;
        break;
    }

    record.createdAt = serverData.creation ? new Date(serverData.creation) : now;
    record.updatedAt = serverData.modified ? new Date(serverData.modified) : now;
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
}

// Create and export singleton instance
const watermelonManager = new WatermelonManager();
export default watermelonManager;

import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { Q } from '@nozbe/watermelondb';

import schema from './schema';
import migrations from './migrations';
import { modelClasses } from './models';

/**
 * WatermelonDB Manager for GRM Mobile App
 * Provides reactive, high-performance database operations using SQLite
 *
 * NOTE: All custom sync methods removed per WatermelonDB sync implementation guidelines
 * Sync is now handled by WatermelonSyncManager using official WatermelonDB sync protocol
 */
class WatermelonManager {
  constructor() {
    this.database = null;
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
          jsi: false,
          migrations,
          ...(__DEV__ && { dbName: 'GrmWatermelonDatabase' }),
        });

        // Create the database instance
        this.database = new Database({
          adapter,
          modelClasses,
          actionsEnabled: true,
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
   * Issues Management - Updated to use corrected field names
   */
  async getIssues(filters = {}) {
    try {
      const db = this.getDatabase();
      const issuesCollection = db.get('grm_issues');
      let query = issuesCollection.query();

      // Apply filters using CORRECTED field names
      const queryFilters = [];

      if (filters.project) {
        queryFilters.push(Q.where('project', filters.project));
      }

      if (filters.status) {
        queryFilters.push(Q.where('status', filters.status));
      }

      if (filters.category) {
        queryFilters.push(Q.where('category', filters.category));
      }

      if (filters.assignee) {
        queryFilters.push(Q.where('assignee', filters.assignee));
      }

      if (filters.reporter) {
        queryFilters.push(Q.where('reporter', filters.reporter));
      }

      if (filters.administrative_region) {
        queryFilters.push(Q.where('administrative_region', filters.administrative_region));
      }

      // Date range filters
      if (filters.from_date) {
        queryFilters.push(Q.where('issue_date', Q.gte(new Date(filters.from_date).getTime())));
      }

      if (filters.to_date) {
        queryFilters.push(Q.where('issue_date', Q.lte(new Date(filters.to_date).getTime())));
      }

      // Add sorting using correct WatermelonDB syntax
      if (queryFilters.length > 0) {
        query = issuesCollection.query(...queryFilters, Q.sortBy('issue_date', Q.desc));
      } else {
        query = issuesCollection.query(Q.sortBy('issue_date', Q.desc));
      }

      const issues = await query.fetch();
      // Return raw data directly - no transformation
      return issues
        .filter((issue) => issue && issue._raw)
        .map((issue) => ({
          ...issue._raw,
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
      const issue = await db.get('grm_issues').find(issueId);

      if (issue) {
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
      return null;
    }
  }

  async createIssue(issueData) {
    try {
      console.log('🔍 [WM] createIssue called with data:', issueData);

      const db = this.getDatabase();

      const issue = await db.write(async () => {
        return await db.get('grm_issues').create((issue) => {
          // Basic fields using model decorators
          if (issueData.description !== undefined) issue.description = issueData.description || '';
          if (issueData.tracking_code !== undefined)
            issue.trackingCode = issueData.tracking_code || '';
          if (issueData.citizen !== undefined) issue.citizen = issueData.citizen || '';
          if (issueData.citizen_type !== undefined)
            issue.citizenType = issueData.citizen_type || '';
          if (issueData.gender !== undefined) issue.gender = issueData.gender;
          if (issueData.contact_medium !== undefined)
            issue.contactMedium = issueData.contact_medium || '';
          if (issueData.contact_info_type !== undefined)
            issue.contactInfoType = issueData.contact_info_type;
          if (issueData.contact_information !== undefined)
            issue.contactInformation = issueData.contact_information;
          if (issueData.resolution_days !== undefined)
            issue.resolutionDays = issueData.resolution_days;
          if (issueData.resolution_accepted !== undefined)
            issue.resolutionAccepted = issueData.resolution_accepted;
          if (issueData.rating !== undefined) issue.rating = issueData.rating;
          if (issueData.escalate_flag !== undefined) issue.escalateFlag = issueData.escalate_flag;
          if (issueData.confirmed !== undefined) issue.confirmed = issueData.confirmed;

          // UPDATED: Foreign key fields using corrected field names (no _id suffix)
          if (issueData.project !== undefined) issue._setRaw('project', issueData.project || '');
          if (issueData.category !== undefined) issue._setRaw('category', issueData.category || '');
          if (issueData.issue_type !== undefined)
            issue._setRaw('issue_type', issueData.issue_type || '');
          if (issueData.status !== undefined) issue._setRaw('status', issueData.status || '');
          if (issueData.citizen_age_group !== undefined)
            issue._setRaw('citizen_age_group', issueData.citizen_age_group);
          if (issueData.citizen_group_1 !== undefined)
            issue._setRaw('citizen_group_1', issueData.citizen_group_1);
          if (issueData.citizen_group_2 !== undefined)
            issue._setRaw('citizen_group_2', issueData.citizen_group_2);
          if (issueData.reporter !== undefined) issue._setRaw('reporter', issueData.reporter || '');
          if (issueData.assignee !== undefined) issue._setRaw('assignee', issueData.assignee);
          if (issueData.administrative_region !== undefined)
            issue._setRaw('administrative_region', issueData.administrative_region || '');
          if (issueData.amended_from !== undefined)
            issue._setRaw('amended_from', issueData.amended_from);

          // Date fields - use decorator methods for dates
          if (issueData.issue_date !== undefined) {
            const issueDate =
              typeof issueData.issue_date === 'string'
                ? new Date(issueData.issue_date)
                : new Date(issueData.issue_date);
            issue.issueDate = issueDate;
          }

          if (issueData.intake_date !== undefined) {
            const intakeDate =
              typeof issueData.intake_date === 'string'
                ? new Date(issueData.intake_date)
                : new Date(issueData.intake_date);
            issue.intakeDate = intakeDate;
          }

          // Set timestamps
          const now = new Date();
          issue.createdAt = now;
          issue.updatedAt = now;

          // Add Frappe sync timestamps
          issue.creation = now;
          issue.modified = now;
        });
      });

      console.log('✅ [WM] Issue created successfully:', issue.id);
      return issue._raw;
    } catch (error) {
      console.error('❌ [WM] Error creating issue:', error);
      throw error;
    }
  }

  /**
   * Batch create attachments for an issue
   */
  async createIssueAttachments(attachments) {
    if (!attachments || !attachments.length) return [];
    const db = this.getDatabase();
    return await db.write(async () => {
      const created = [];
      for (const att of attachments) {
        // Validate required fields - only need issue and attachment_url
        if (!att.issue || !att.attachment_url) {
          console.error('[WM] Attachment missing required fields:', att);
          continue;
        }
        console.log('🔍 [WM] Creating attachment:', att);
        const record = await db.get('grm_issue_attachments').create((a) => {
          // Map to backend schema fields only
          a._setRaw('grm_issue', att.issue);
          a._setRaw('attachment', att.attachment_url);
          a._setRaw(
            'file_name',
            att.attachment_name || (att.attachment_url && att.attachment_url.split('/').pop())
          );
          a._setRaw('local_url', att.attachment_url);
          a._setRaw('uploaded', false);
          
          // Set timestamps
          const now = new Date();
          a._setRaw('creation', now.getTime());
          a._setRaw('modified', now.getTime());
          a._setRaw('created_at', now.getTime());
          a._setRaw('updated_at', now.getTime());
        });
        created.push(record._raw);
      }
      console.log('🔍 [WM] Created attachments:', created);
      return created;
    });
  }

  async updateIssue(issueId, updateData) {
    try {
      const db = this.getDatabase();
      const issue = await db.get('grm_issues').find(issueId);

      const updatedIssue = await db.write(async () => {
        return await issue.update((issue) => {
          // Basic fields
          if (updateData.description !== undefined) issue.description = updateData.description;
          if (updateData.tracking_code !== undefined) issue.trackingCode = updateData.tracking_code;
          if (updateData.citizen !== undefined) issue.citizen = updateData.citizen;
          if (updateData.citizen_type !== undefined) issue.citizenType = updateData.citizen_type;
          if (updateData.gender !== undefined) issue.gender = updateData.gender;
          if (updateData.contact_medium !== undefined)
            issue.contactMedium = updateData.contact_medium;
          if (updateData.contact_info_type !== undefined)
            issue.contactInfoType = updateData.contact_info_type;
          if (updateData.contact_information !== undefined)
            issue.contactInformation = updateData.contact_information;
          if (updateData.resolution_days !== undefined)
            issue.resolutionDays = updateData.resolution_days;
          if (updateData.resolution_accepted !== undefined)
            issue.resolutionAccepted = updateData.resolution_accepted;
          if (updateData.rating !== undefined) issue.rating = updateData.rating;
          if (updateData.escalate_flag !== undefined) issue.escalateFlag = updateData.escalate_flag;
          if (updateData.confirmed !== undefined) issue.confirmed = updateData.confirmed;

          // UPDATED: Foreign key fields using corrected field names (no _id suffix)
          if (updateData.project !== undefined) issue._setRaw('project', updateData.project || '');
          if (updateData.category !== undefined)
            issue._setRaw('category', updateData.category || '');
          if (updateData.issue_type !== undefined)
            issue._setRaw('issue_type', updateData.issue_type || '');
          if (updateData.status !== undefined) issue._setRaw('status', updateData.status || '');
          if (updateData.citizen_age_group !== undefined)
            issue._setRaw('citizen_age_group', updateData.citizen_age_group);
          if (updateData.citizen_group_1 !== undefined)
            issue._setRaw('citizen_group_1', updateData.citizen_group_1);
          if (updateData.citizen_group_2 !== undefined)
            issue._setRaw('citizen_group_2', updateData.citizen_group_2);
          if (updateData.reporter !== undefined)
            issue._setRaw('reporter', updateData.reporter || '');
          if (updateData.assignee !== undefined) issue._setRaw('assignee', updateData.assignee);
          if (updateData.administrative_region !== undefined)
            issue._setRaw('administrative_region', updateData.administrative_region || '');
          if (updateData.amended_from !== undefined)
            issue._setRaw('amended_from', updateData.amended_from);

          // Update timestamps
          issue.updatedAt = new Date();
          issue.modified = new Date();
        });
      });

      return updatedIssue._raw;
    } catch (error) {
      console.error('❌ [WM] Error updating issue:', error);
      throw error;
    }
  }

  async deleteIssue(issueId) {
    try {
      const db = this.getDatabase();
      const issue = await db.get('grm_issues').find(issueId);

      await db.write(async () => {
        await issue.destroyPermanently();
      });

      console.log('✅ [WM] Issue deleted successfully:', issueId);
      return true;
    } catch (error) {
      console.error('❌ [WM] Error deleting issue:', error);
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
      return statuses
        .filter((status) => status && status._raw)
        .map((status) => ({
          ...status._raw,
          name: status._raw.id || status._raw.name,
        }));
    } catch (error) {
      console.error('Error fetching statuses from WatermelonDB:', error);
      return [];
    }
  }

  async getIssueCategories(projectId = null) {
    try {
      const db = this.getDatabase();
      let query = db.get('grm_issue_categories').query();

      const categories = await query.fetch();
      const result = categories
        .filter((category) => category && category._raw)
        .map((category) => ({
          ...category._raw,
          name: category._raw.id || category._raw.name,
        }))
        .filter((category) => category !== null);

      return result;
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

      if (filters.project || filters.project_id) {
        queryFilters.push(Q.where('project', filters.project || filters.project_id));
      }

      if (filters.parent_region || filters.parent_region_id) {
        queryFilters.push(
          Q.where('parent_region', filters.parent_region || filters.parent_region_id)
        );
      }

      if (filters.administrative_level || filters.administrative_level_id) {
        queryFilters.push(
          Q.where(
            'administrative_level',
            filters.administrative_level || filters.administrative_level_id
          )
        );
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
   * Reactive Query Methods for UI Components - Updated field references
   */
  observeIssues(filters = {}) {
    try {
      const db = this.getDatabase();
      const issuesCollection = db.get('grm_issues');
      let query = issuesCollection.query();

      // Apply filters using CORRECTED field names
      const queryFilters = [];

      if (filters.project) {
        queryFilters.push(Q.where('project', filters.project));
      }

      if (filters.status) {
        queryFilters.push(Q.where('status', filters.status));
      }

      if (filters.category) {
        queryFilters.push(Q.where('category', filters.category));
      }

      if (filters.assignee) {
        queryFilters.push(Q.where('assignee', filters.assignee));
      }

      if (filters.reporter) {
        queryFilters.push(Q.where('reporter', filters.reporter));
      }

      if (filters.administrative_region) {
        queryFilters.push(Q.where('administrative_region', filters.administrative_region));
      }

      // Apply filters and sorting
      if (queryFilters.length > 0) {
        query = issuesCollection.query(...queryFilters, Q.sortBy('issue_date', Q.desc));
      } else {
        query = issuesCollection.query(Q.sortBy('issue_date', Q.desc));
      }

      return query.observe();
    } catch (error) {
      console.error('Error creating observable query for issues:', error);
      return [];
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

  /**
   * Fetch all attachments for a given issue
   */
  async getAttachmentsForIssue(issueId) {
    try {
      const db = this.getDatabase();
      const atts = await db.get('grm_issue_attachments').query().fetch();
      // Filter by grm_issue field
      console.log('🔍 [WM] All attachments:', atts);
      const filtered = atts.filter((a) => a._raw?.grm_issue === issueId);
      // Return as plain objects
      console.log('🔍 [WM] Filtered attachments:', filtered);
      return filtered.map((a) => a._raw);
    } catch (e) {
      return [];
    }
  }
}

// Create and export singleton instance
const watermelonManager = new WatermelonManager();
export default watermelonManager;

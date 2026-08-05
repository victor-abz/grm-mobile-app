import { Database, Q } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import schema from './schema';
import migrations from './migrations';
import { modelClasses } from './models';
import { logger } from '../utils/logger';

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
        logger.info('WatermelonDB: Database initialized successfully');
      } catch (error) {
        logger.error('WatermelonDB: Failed to initialize database', error);
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
    const startTime = Date.now();
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
      const duration = Date.now() - startTime;

      const results = issues
        .filter((issue) => issue && issue._raw)
        .map((issue) => ({
          ...issue._raw,
          name: issue._raw.id || issue._raw.name,
        }))
        .filter((issue) => issue !== null);

      logger.database('getIssues', 'grm_issues', duration, {
        filterCount: Object.keys(filters).length,
        resultCount: results.length,
      });

      return results;
    } catch (error) {
      logger.error('WatermelonDB: Error fetching issues', error, {
        filters: Object.keys(filters),
      });
      return [];
    }
  }

  async getIssue(issueId) {
    try {
      logger.database('getIssue', 'grm_issues', 0, { issueId });

      const db = this.getDatabase();
      const issue = await db.get('grm_issues').find(issueId);

      if (issue) {
        const result = {
          ...issue._raw,
          name: issue._raw.id || issue._raw.name,
        };

        logger.info('WatermelonDB: Issue found', { issueId, hasResult: true });
        return result;
      }
      logger.warn('WatermelonDB: Issue not found', { issueId });
      return null;
    } catch (error) {
      logger.error('WatermelonDB: Error fetching issue', error, { issueId });
      return null;
    }
  }

  async createIssue(issueData) {
    try {
      logger.info('WatermelonDB: Creating issue', {
        category: issueData.category,
        project: issueData.project,
        hasDescription: !!issueData.description,
      });

      const db = this.getDatabase();

      const issue = await db.write(async () =>
        db.get('grm_issues').create((issueModel) => {
          // Basic fields using model decorators
          if (issueData.description !== undefined)
            issueModel.description = issueData.description || '';
          if (issueData.tracking_code !== undefined)
            issueModel.trackingCode = issueData.tracking_code || '';
          if (issueData.citizen !== undefined) issueModel.citizen = issueData.citizen || '';
          if (issueData.citizen_type !== undefined)
            issueModel.citizenType = issueData.citizen_type || '';
          if (issueData.gender !== undefined) issueModel.gender = issueData.gender;
          if (issueData.contact_medium !== undefined)
            issueModel.contactMedium = issueData.contact_medium || '';
          if (issueData.contact_info_type !== undefined)
            issueModel.contactInfoType = issueData.contact_info_type;
          if (issueData.contact_information !== undefined)
            issueModel.contactInformation = issueData.contact_information;
          if (issueData.resolution_days !== undefined)
            issueModel.resolutionDays = issueData.resolution_days;
          if (issueData.resolution_accepted !== undefined)
            issueModel.resolutionAccepted = issueData.resolution_accepted;
          if (issueData.rating !== undefined) issueModel.rating = issueData.rating;
          if (issueData.escalate_flag !== undefined)
            issueModel.escalateFlag = issueData.escalate_flag;
          if (issueData.confirmed !== undefined) issueModel.confirmed = issueData.confirmed;

          // UPDATED: Foreign key fields using corrected field names (no _id suffix)
          if (issueData.project !== undefined)
            issueModel._setRaw('project', issueData.project || '');
          if (issueData.category !== undefined)
            issueModel._setRaw('category', issueData.category || '');
          if (issueData.issue_type !== undefined)
            issueModel._setRaw('issue_type', issueData.issue_type || '');
          if (issueData.status !== undefined) issueModel._setRaw('status', issueData.status || '');
          if (issueData.citizen_age_group !== undefined)
            issueModel._setRaw('citizen_age_group', issueData.citizen_age_group);
          if (issueData.citizen_group_1 !== undefined)
            issueModel._setRaw('citizen_group_1', issueData.citizen_group_1);
          if (issueData.citizen_group_2 !== undefined)
            issueModel._setRaw('citizen_group_2', issueData.citizen_group_2);
          if (issueData.reporter !== undefined)
            issueModel._setRaw('reporter', issueData.reporter || '');
          if (issueData.assignee !== undefined) issueModel._setRaw('assignee', issueData.assignee);
          if (issueData.administrative_region !== undefined)
            issueModel._setRaw('administrative_region', issueData.administrative_region || '');
          if (issueData.amended_from !== undefined)
            issueModel._setRaw('amended_from', issueData.amended_from);

          // Date fields - use decorator methods for dates
          if (issueData.issue_date !== undefined) {
            const issueDate =
              typeof issueData.issue_date === 'string'
                ? new Date(issueData.issue_date)
                : new Date(issueData.issue_date);
            issueModel.issueDate = issueDate;
          }

          if (issueData.intake_date !== undefined) {
            const intakeDate =
              typeof issueData.intake_date === 'string'
                ? new Date(issueData.intake_date)
                : new Date(issueData.intake_date);
            issueModel.intakeDate = intakeDate;
          }

          // Set timestamps
          const now = new Date();
          issueModel.createdAt = now;
          issueModel.updatedAt = now;

          // Add Frappe sync timestamps
          issueModel.creation = now;
          issueModel.modified = now;
        })
      );

      logger.info('WatermelonDB: Issue created successfully', {
        issueId: issue.id,
        project: issueData.project,
        category: issueData.category,
      });
      return issue._raw;
    } catch (error) {
      logger.error('WatermelonDB: Error creating issue', error, {
        project: issueData?.project,
        category: issueData?.category,
      });
      throw error;
    }
  }

  /**
   * Batch create attachments for an issue
   */
  async createIssueAttachments(attachments) {
    if (!attachments || !attachments.length) return [];
    const db = this.getDatabase();
    return db.write(async () => {
      // Filter valid attachments first
      const validAttachments = attachments.filter((att) => {
        if (!att.issue || !att.attachment_url) {
          console.error('[WM] Attachment missing required fields:', att);
          return false;
        }
        return true;
      });

      // Create all attachments concurrently using Promise.all
      const createPromises = validAttachments.map((att) => {
        logger.database('createAttachment', 'grm_issue_attachments', 0, {
          issueId: att.issue,
          hasUrl: !!att.attachment_url,
        });
        return db.get('grm_issue_attachments').create((a) => {
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
      });

      const created = await Promise.all(createPromises);
      const createdRaws = created.map((record) => record._raw);
      logger.info('WatermelonDB: Created attachments', {
        createdCount: createdRaws.length,
        validAttachmentsCount: validAttachments.length,
      });
      return createdRaws;
    });
  }

  async updateIssue(issueId, updateData) {
    try {
      const db = this.getDatabase();
      const issue = await db.get('grm_issues').find(issueId);

      const updatedIssue = await db.write(async () =>
        issue.update((issueModel) => {
          // Basic fields
          if (updateData.description !== undefined) issueModel.description = updateData.description;
          if (updateData.tracking_code !== undefined)
            issueModel.trackingCode = updateData.tracking_code;
          if (updateData.citizen !== undefined) issueModel.citizen = updateData.citizen;
          if (updateData.citizen_type !== undefined)
            issueModel.citizenType = updateData.citizen_type;
          if (updateData.gender !== undefined) issueModel.gender = updateData.gender;
          if (updateData.contact_medium !== undefined)
            issueModel.contactMedium = updateData.contact_medium;
          if (updateData.contact_info_type !== undefined)
            issueModel.contactInfoType = updateData.contact_info_type;
          if (updateData.contact_information !== undefined)
            issueModel.contactInformation = updateData.contact_information;
          if (updateData.resolution_days !== undefined)
            issueModel.resolutionDays = updateData.resolution_days;
          if (updateData.resolution_accepted !== undefined)
            issueModel.resolutionAccepted = updateData.resolution_accepted;
          if (updateData.rating !== undefined) issueModel.rating = updateData.rating;
          if (updateData.escalate_flag !== undefined)
            issueModel.escalateFlag = updateData.escalate_flag;
          if (updateData.confirmed !== undefined) issueModel.confirmed = updateData.confirmed;

          // UPDATED: Foreign key fields using corrected field names (no _id suffix)
          if (updateData.project !== undefined)
            issueModel._setRaw('project', updateData.project || '');
          if (updateData.category !== undefined)
            issueModel._setRaw('category', updateData.category || '');
          if (updateData.issue_type !== undefined)
            issueModel._setRaw('issue_type', updateData.issue_type || '');
          if (updateData.status !== undefined)
            issueModel._setRaw('status', updateData.status || '');
          if (updateData.citizen_age_group !== undefined)
            issueModel._setRaw('citizen_age_group', updateData.citizen_age_group);
          if (updateData.citizen_group_1 !== undefined)
            issueModel._setRaw('citizen_group_1', updateData.citizen_group_1);
          if (updateData.citizen_group_2 !== undefined)
            issueModel._setRaw('citizen_group_2', updateData.citizen_group_2);
          if (updateData.reporter !== undefined)
            issueModel._setRaw('reporter', updateData.reporter || '');
          if (updateData.assignee !== undefined)
            issueModel._setRaw('assignee', updateData.assignee);
          if (updateData.administrative_region !== undefined)
            issueModel._setRaw('administrative_region', updateData.administrative_region || '');
          if (updateData.amended_from !== undefined)
            issueModel._setRaw('amended_from', updateData.amended_from);

          // Update timestamps
          issueModel.updatedAt = new Date();
          issueModel.modified = new Date();
        })
      );

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

      logger.info('WatermelonDB: Issue deleted successfully', { issueId });
      return true;
    } catch (error) {
      logger.error('WatermelonDB: Error deleting issue', error, { issueId });
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

  async getIssueCategories(_projectId = null) {
    try {
      const db = this.getDatabase();
      const query = db.get('grm_issue_categories').query();

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

  async getIssueTypes(_projectId = null) {
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

      logger.database('getProjects', 'grm_projects', 0, {
        foundRecords: projects.length,
      });

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

      logger.info('WatermelonDB: Projects filtered', {
        validProjects: validProjects.length,
        totalProjects: projects.length,
      });

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

      logger.info('WatermelonDB: Projects processed successfully', {
        processedCount: transformedProjects.length,
      });

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
   * Paginated Issues Query for Tab-based Pagination
   * Fetches issues with filtering and pagination based on tab requirements
   */
  async getPaginatedIssues(filters = {}, page = 1, pageSize = 20) {
    try {
      const db = this.getDatabase();
      const issuesCollection = db.get('grm_issues');

      // Build query filters
      const queryFilters = [];

      // Basic filters
      if (filters.project) {
        queryFilters.push(Q.where('project', filters.project));
      }

      if (filters.status) {
        queryFilters.push(Q.where('status', filters.status));
      }

      if (filters.category) {
        queryFilters.push(Q.where('category', filters.category));
      }

      if (filters.administrative_region) {
        queryFilters.push(Q.where('administrative_region', filters.administrative_region));
      }

      // Status exclusion filter (for non-final status filtering)
      if (filters.excludeStatusId) {
        queryFilters.push(Q.where('status', Q.notEq(filters.excludeStatusId)));
      }

      // User involvement filters (OR condition for assignee or reporter)
      if (filters.assignee || filters.reporter) {
        if (filters.assignee && filters.reporter && filters.assignee === filters.reporter) {
          // Same user for both assignee and reporter - use OR condition
          queryFilters.push(
            Q.or(Q.where('assignee', filters.assignee), Q.where('reporter', filters.reporter))
          );
        } else {
          // Separate filters
          if (filters.assignee) {
            queryFilters.push(Q.where('assignee', filters.assignee));
          }
          if (filters.reporter) {
            queryFilters.push(Q.where('reporter', filters.reporter));
          }
        }
      }

      // Date range filters
      if (filters.from_date) {
        queryFilters.push(Q.where('issue_date', Q.gte(new Date(filters.from_date).getTime())));
      }

      if (filters.to_date) {
        queryFilters.push(Q.where('issue_date', Q.lte(new Date(filters.to_date).getTime())));
      }

      // Build base query for counting
      const baseQuery =
        queryFilters.length > 0
          ? issuesCollection.query(...queryFilters)
          : issuesCollection.query();

      // Get total count
      const totalCount = await baseQuery.fetchCount();

      // Get paginated results with sorting
      const offset = (page - 1) * pageSize;
      const paginatedQuery =
        queryFilters.length > 0
          ? issuesCollection.query(
              ...queryFilters,
              Q.sortBy('issue_date', Q.desc),
              Q.skip(offset),
              Q.take(pageSize)
            )
          : issuesCollection.query(
              Q.sortBy('issue_date', Q.desc),
              Q.skip(offset),
              Q.take(pageSize)
            );

      const issues = await paginatedQuery.fetch();

      return {
        issues: issues
          .filter((issue) => issue && issue._raw)
          .map((issue) => ({
            ...issue._raw,
            name: issue._raw.id || issue._raw.name,
          })),
        pagination: {
          currentPage: page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
          hasNextPage: page < Math.ceil(totalCount / pageSize),
          hasPreviousPage: page > 1,
          startIndex: totalCount > 0 ? offset + 1 : 0,
          endIndex: Math.min(offset + pageSize, totalCount),
        },
      };
    } catch (error) {
      console.error('Error fetching paginated issues:', error);
      return {
        issues: [],
        pagination: {
          currentPage: 1,
          pageSize,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
          startIndex: 0,
          endIndex: 0,
        },
      };
    }
  }

  /**
   * Get issue counts for the tab badges, scoped to the regions the user is
   * responsible for (their assigned regions plus all descendants).
   *
   * `regionIds` comes from `utils/regionScope.getAccessibleRegionIds`. An empty
   * list means the user has no assignments, which must read as zero issues —
   * never as "every issue".
   */
  async getIssueCountsByRegionScope(regionIds = []) {
    try {
      const db = this.getDatabase();
      const issuesCollection = db.get('grm_issues');
      const statusesCollection = db.get('grm_issue_statuses');

      const inScope = Q.where('administrative_region', Q.oneOf(regionIds));

      // The workflow has several closing statuses ("Resolved", "Closed"), so
      // collect all of them — matching only the first one leaves issues in the
      // wrong bucket.
      const finalStatuses = await statusesCollection.query(Q.where('final_status', true)).fetch();
      const finalStatusIds = finalStatuses.map((status) => status.id);
      const hasFinalStatuses = finalStatusIds.length > 0;

      const [assignedCount, openCount, resolvedCount] = await Promise.all([
        // Assigned: everything the user is responsible for, any status
        issuesCollection.query(inScope).fetchCount(),

        // Open: in scope and not yet at a final status
        hasFinalStatuses
          ? issuesCollection.query(inScope, Q.where('status', Q.notIn(finalStatusIds))).fetchCount()
          : issuesCollection.query(inScope).fetchCount(),

        // Resolved: in scope and at a final status
        hasFinalStatuses
          ? issuesCollection.query(inScope, Q.where('status', Q.oneOf(finalStatusIds))).fetchCount()
          : Promise.resolve(0),
      ]);

      return {
        assigned: assignedCount,
        open: openCount,
        resolved: resolvedCount,
      };
    } catch (error) {
      console.error('Error getting issue counts by region scope:', error);
      return {
        assigned: 0,
        open: 0,
        resolved: 0,
      };
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
      logger.info('WatermelonDB: Database cleared successfully');
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

          logger.info('WatermelonDB: User context updated successfully', { userId });
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

          logger.info('WatermelonDB: User context created successfully', { userId });
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

      logger.info('WatermelonDB: User context cleared successfully', { userId });
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
      logger.database('getAttachmentsForIssue', 'grm_issue_attachments', 0, {
        totalAttachments: atts.length,
        issueId,
      });
      const filtered = atts.filter((a) => a._raw?.grm_issue === issueId);
      // Return as plain objects
      logger.info('WatermelonDB: Attachments filtered for issue', {
        filteredCount: filtered.length,
        issueId,
      });
      return filtered.map((a) => a._raw);
    } catch (e) {
      return [];
    }
  }
}

// Create and export singleton instance
const watermelonManager = new WatermelonManager();
export default watermelonManager;

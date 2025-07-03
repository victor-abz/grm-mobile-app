import React from 'react';
import { withObservables } from '@nozbe/watermelondb/react';
import LookupDataManager from '../services/LookupDataManager';

/**
 * Higher-order component to provide reactive lookup data
 * Uses WatermelonDB's withObservables for reactive updates
 * Now returns raw Frappe data directly - no complex transformations
 */

/**
 * HOC for categories - Returns raw Frappe data
 */
export const withCategories = (Component, projectId = null) => {
  const enhance = withObservables(['projectId'], ({ projectId }) => ({
    categories: LookupDataManager.observeCategories(projectId),
  }));

  return enhance(Component);
};

/**
 * HOC for issue types - Returns raw Frappe data
 */
export const withTypes = (Component, projectId = null) => {
  const enhance = withObservables(['projectId'], ({ projectId }) => ({
    types: LookupDataManager.observeTypes(projectId),
  }));

  return enhance(Component);
};

/**
 * HOC for statuses - Returns raw Frappe data
 */
export const withStatuses = (Component) => {
  const enhance = withObservables([], () => ({
    statuses: LookupDataManager.observeStatuses(),
  }));

  return enhance(Component);
};

/**
 * HOC for age groups - Returns raw Frappe data
 */
export const withAgeGroups = (Component) => {
  const enhance = withObservables([], () => ({
    ageGroups: LookupDataManager.observeAgeGroups(),
  }));

  return enhance(Component);
};

/**
 * HOC for citizen groups - Returns raw Frappe data
 */
export const withCitizenGroups = (Component) => {
  const enhance = withObservables([], () => ({
    citizenGroups: LookupDataManager.observeCitizenGroups(),
  }));

  return enhance(Component);
};

/**
 * HOC for departments - Returns raw Frappe data
 */
export const withDepartments = (Component) => {
  const enhance = withObservables([], () => ({
    departments: LookupDataManager.observeDepartments(),
  }));

  return enhance(Component);
};

/**
 * HOC for projects - Returns raw Frappe data
 */
export const withProjects = (Component) => {
  const enhance = withObservables([], () => ({
    projects: LookupDataManager.observeProjects(),
  }));

  return enhance(Component);
};

/**
 * HOC for regions - Returns raw Frappe data
 */
export const withRegions = (Component, filters = {}) => {
  const enhance = withObservables(['filters'], ({ filters }) => ({
    regions: LookupDataManager.observeRegions(filters || {}),
  }));

  return enhance(Component);
};

/**
 * HOC for all lookup data combined - Returns raw Frappe data
 */
export const withAllLookupData = (Component, projectId = null) => {
  const enhance = withObservables(['projectId'], ({ projectId }) => ({
    categories: LookupDataManager.observeCategories(projectId),
    types: LookupDataManager.observeTypes(projectId),
    statuses: LookupDataManager.observeStatuses(),
    ageGroups: LookupDataManager.observeAgeGroups(),
    citizenGroups: LookupDataManager.observeCitizenGroups(),
    departments: LookupDataManager.observeDepartments(),
    projects: LookupDataManager.observeProjects(),
    regions: LookupDataManager.observeRegions({ project: projectId }),
  }));

  return enhance(Component);
};

/**
 * Utility functions for working with raw Frappe data
 */
export const LookupUtils = {
  /**
   * Find item by name (Frappe primary identifier)
   */
  findByName: (items, name) => {
    return items.find((item) => item.name === name);
  },

  /**
   * Get display value for an item (fallback chain for display text)
   */
  getDisplayValue: (item) => {
    if (!item) return '';
    return (
      item.title ||
      item.category_name ||
      item.type_name ||
      item.status_name ||
      item.age_group ||
      item.group_name ||
      item.department_name ||
      item.region_name ||
      item.name ||
      ''
    );
  },

  /**
   * Filter active items (handle different ways Frappe stores active status)
   */
  filterActive: (items) => {
    return items.filter((item) => {
      // Different ways Frappe stores active status
      return item.is_active !== false && item.active !== false && item.disabled !== true;
    });
  },

  /**
   * Sort items by display value
   */
  sortByDisplay: (items) => {
    return [...items].sort((a, b) => {
      const displayA = LookupUtils.getDisplayValue(a).toLowerCase();
      const displayB = LookupUtils.getDisplayValue(b).toLowerCase();
      return displayA.localeCompare(displayB);
    });
  },
};

export default {
  withCategories,
  withTypes,
  withStatuses,
  withAgeGroups,
  withCitizenGroups,
  withDepartments,
  withProjects,
  withRegions,
  withAllLookupData,
  LookupUtils,
};

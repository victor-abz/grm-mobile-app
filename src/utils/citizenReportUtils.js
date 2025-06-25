/**
 * Citizen Report Utilities - Clean logic for processing citizen report data
 * Extends issueDetailUtils with specific functions for citizen reporting flows
 * Follows DRY principles by providing reusable lookup processing
 */

import { createLookupMap } from './issueDetailUtils';

/**
 * Process age groups for dropdown display
 * Handles WatermelonDB model objects with proper field mapping
 */
export const processAgeGroups = (ageGroups) => {
  if (!ageGroups || ageGroups.length === 0) {
    console.log('🔍 [CITIZEN_REPORT] Age groups - no data available');
    return [];
  }

  // Handle WatermelonDB model objects - access properties via getters
  const result = ageGroups
    .filter((ageGroup) => ageGroup && ageGroup.id) // Ensure valid records
    .map((ageGroup) => ({
      // Use Frappe's native structure
      name: ageGroup.id, // Frappe primary identifier (stored as WatermelonDB id)
      label: ageGroup.ageGroup || ageGroup.id, // Display name from age_group_name field with fallback
      value: ageGroup.id, // Use id as value for form
      // Keep reference to original model
      _model: ageGroup,
      // Include additional properties for debugging
      ageGroup: ageGroup.ageGroup,
      createdAt: ageGroup.createdAt,
      updatedAt: ageGroup.updatedAt,
    }));

  console.log(`✅ [CITIZEN_REPORT] Age groups processed: ${result.length} items`);
  if (result.length > 0) {
    console.log('🔍 [CITIZEN_REPORT] Sample age group:', {
      name: result[0].name,
      label: result[0].label,
      ageGroup: result[0].ageGroup,
    });
  }
  return result;
};

/**
 * Process citizen groups for specific group type (1 or 2)
 * Handles WatermelonDB model objects with proper filtering and field mapping
 */
export const processCitizenGroupsByType = (citizenGroups, groupType) => {
  if (!citizenGroups || citizenGroups.length === 0) {
    console.log(`🔍 [CITIZEN_REPORT] Citizen groups type ${groupType} - no data available`);
    return [];
  }

  // Handle WatermelonDB model objects and filter for specific group_type
  const result = citizenGroups
    .filter(
      (group) =>
        group &&
        group.id &&
        (group.groupType === String(groupType) || group.groupType === groupType)
    )
    .map((group) => {
      console.log(`🔍 [CITIZEN_REPORT] Processing citizen group type ${groupType}:`, {
        id: group.id,
        groupName: group.groupName,
        groupType: group.groupType,
      });

      return {
        // Use Frappe's native structure
        name: group.id, // Frappe primary identifier (stored as WatermelonDB id)
        label: group.groupName || group.id, // Display name from group_name field
        value: group.id, // Use id as value for form
        group_type: group.groupType,
        // Keep reference to original model
        _model: group,
        // Include additional properties for debugging
        groupName: group.groupName,
        groupType: group.groupType,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      };
    });

  console.log(
    `✅ [CITIZEN_REPORT] Citizen groups type ${groupType} processed: ${result.length} items`
  );
  if (result.length > 0) {
    console.log(`🔍 [CITIZEN_REPORT] Sample citizen group type ${groupType}:`, {
      name: result[0].name,
      label: result[0].label,
      groupName: result[0].groupName,
      groupType: result[0].groupType,
    });
  }
  return result;
};

/**
 * Process categories for step 2 dropdown display
 * Handles WatermelonDB model objects with proper field mapping
 */
export const processCategories = (categories) => {
  if (!categories || categories.length === 0) {
    console.log('🔍 [CITIZEN_REPORT] Categories - no data available');
    return [];
  }

  const result = categories
    .filter((category) => category && category.id) // Ensure valid records
    .map((category) => ({
      // Use Frappe's native structure
      id: category.id,
      name: category.id, // Frappe uses id as name
      confidentiality_level: category.confidentialityLevel,
      assigned_department_id: category.assignedDepartmentId,
      assigned_department: category.assignedDepartmentId,
      administrative_level_id: category.administrativeLevelId,
      administrative_level: category.administrativeLevelId,
      categoryName: category.categoryName,
      // Keep reference to original model
      _model: category,
    }));

  console.log(`✅ [CITIZEN_REPORT] Categories processed: ${result.length} items`);
  if (result.length > 0) {
    console.log('🔍 [CITIZEN_REPORT] Sample category:', {
      id: result[0].id,
      categoryName: result[0].categoryName,
      confidentiality_level: result[0].confidentiality_level,
    });
  }
  return result;
};

/**
 * Process types for step 2 dropdown display
 * Handles WatermelonDB model objects with proper field mapping
 */
export const processTypes = (types) => {
  if (!types || types.length === 0) {
    console.log('🔍 [CITIZEN_REPORT] Types - no data available');
    return [];
  }

  const result = types
    .filter((type) => type && type.id) // Ensure valid records
    .map((type) => ({
      // Use Frappe's native structure
      id: type.id,
      name: type.id, // Frappe uses id as name
      typeName: type.typeName,
      // Keep reference to original model
      _model: type,
    }));

  console.log(`✅ [CITIZEN_REPORT] Types processed: ${result.length} items`);
  if (result.length > 0) {
    console.log('🔍 [CITIZEN_REPORT] Sample type:', {
      id: result[0].id,
      typeName: result[0].typeName,
    });
  }
  return result;
};

/**
 * Get category by ID with proper field mapping
 * Used in step 2 to get category details for validation and navigation
 */
export const getCategoryById = (categories, categoryId) => {
  if (!categories || !categoryId) return null;

  const category = categories.find((cat) => cat.id === categoryId);
  if (!category) {
    console.warn('🔍 [CITIZEN_REPORT] Category not found for value:', categoryId);
    return null;
  }

  const processedCategory = {
    id: category.id,
    name: category.id, // Frappe uses id as name
    confidentiality_level: category.confidentialityLevel,
    assigned_department_id: category.assignedDepartmentId,
    assigned_department: category.assignedDepartmentId,
    administrative_level_id: category.administrativeLevelId,
    administrative_level: category.administrativeLevelId,
    categoryName: category.categoryName,
  };

  console.log('🔍 [CITIZEN_REPORT] Selected category:', processedCategory);
  return processedCategory;
};

/**
 * Process regions for location step dropdown display
 * Handles WatermelonDB model objects with proper hierarchical structure
 */
export const processRegions = (regions) => {
  if (!regions || regions.length === 0) {
    console.log('🔍 [CITIZEN_REPORT] Regions - no data available');
    return [];
  }

  const result = regions
    .filter((region) => region && region.id) // Ensure valid records
    .map((region) => ({
      // Use Frappe's native structure
      id: region.id,
      regionName: region.regionName,
      parentRegion: region.parentRegion,
      administrativeLevel: region.administrativeLevel,
      administrativeLevelId: region.administrativeLevelId,
      // Keep reference to original model
      _model: region,
    }));

  console.log(`✅ [CITIZEN_REPORT] Regions processed: ${result.length} items`);
  return result;
};

/**
 * Create lookup maps specifically for citizen report data
 * Extends createDetailLookupMaps with citizen-report specific mappings
 */
export const createCitizenReportLookupMaps = (lookupData) => {
  const {
    categories = [],
    types = [],
    ageGroups = [],
    citizenGroups = [],
    regions = [],
  } = lookupData;

  return {
    categoryMap: createLookupMap(categories, 'categoryName'),
    typeMap: createLookupMap(types, 'typeName'),
    ageGroupMap: createLookupMap(ageGroups, 'ageGroup'),
    citizenGroupMap: createLookupMap(citizenGroups, 'groupName'),
    regionMap: createLookupMap(regions, 'regionName'),
  };
};

/**
 * Create navigation data with proper field extraction
 * Safely extracts primitive values to avoid circular references
 */
export const createNavigationData = (stepOneParams, additionalData = {}) => {
  return {
    ...stepOneParams,
    // Safely extract age group data
    ageGroup: stepOneParams.selectedAge
      ? {
          name: stepOneParams.selectedAge.name,
          label: stepOneParams.selectedAge.label,
          ageGroup: stepOneParams.selectedAge.ageGroup,
        }
      : null,
    // Safely extract citizen group data
    citizen_group_1: stepOneParams.selectedCitizenGroupI
      ? {
          name: stepOneParams.selectedCitizenGroupI.name,
          label: stepOneParams.selectedCitizenGroupI.label,
          groupName: stepOneParams.selectedCitizenGroupI.groupName,
          groupType: stepOneParams.selectedCitizenGroupI.groupType,
        }
      : null,
    citizen_group_2: stepOneParams.selectedCitizenGroupII
      ? {
          name: stepOneParams.selectedCitizenGroupII.name,
          label: stepOneParams.selectedCitizenGroupII.label,
          groupName: stepOneParams.selectedCitizenGroupII.groupName,
          groupType: stepOneParams.selectedCitizenGroupII.groupType,
        }
      : null,
    // Include additional data
    ...additionalData,
  };
};

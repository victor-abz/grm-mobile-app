/**
 * Citizen Report Utilities - Clean logic for processing citizen report data
 * Extends issueDetailUtils with specific functions for citizen reporting flows
 * Follows DRY principles by providing reusable lookup processing
 */

import { createLookupMap } from './issueDetailUtils';

// Map WatermelonDB table names → Frappe DocType
const TABLE_TO_DOCTYPE_MAP = {
  grm_issues: 'GRM Issue',
  grm_issue_categories: 'GRM Issue Category',
  grm_issue_types: 'GRM Issue Type',
  grm_issue_statuses: 'GRM Issue Status',
  grm_administrative_regions: 'GRM Administrative Region',
  grm_issue_age_groups: 'GRM Issue Age Group',
  grm_issue_citizen_groups: 'GRM Issue Citizen Group',
  grm_issue_departments: 'GRM Issue Department',
  grm_projects: 'GRM Project',
  users: 'User',
  grm_project_links: 'GRM Project Link',
};

// Utility: filter data array by project ID (simple equality check)
// Using a function declaration for hoisting
export function filterByProject(records, projectId, projectLinks = []) {
  console.log('projectLinks in filters', projectLinks);
  if (!projectId) return records;
  try {
    console.log('🔍 [FILTER] Filtering records by projectId:', projectId);
    console.log('🔍 [FILTER] Total incoming records:', records?.length || 0);

    const filtered = records.filter((rec, index) => {
      const raw = rec?._raw || rec;

      // Try direct project field first (regions, etc.)
      let belongs = raw?.project === projectId;

      // Resolve Watermelon table name → DocType
      if (!belongs) {
        // Attempt to get table name from model/collection metadata
        const wmTable = rec?.collection?.modelClass?.table || rec?.constructor?.table || raw?.table;
        const parentType = TABLE_TO_DOCTYPE_MAP[wmTable];

        console.log('parentType to filter', parentType);

        // Only attempt child-table lookup if mapping exists
        if (parentType && projectLinks.length) {
          const linkMatch = projectLinks.find((linkItem) => {
            const linkRaw = linkItem?._raw || linkItem;
            console.log('linkRaw', linkRaw, 'raw', raw);
            return (
              linkRaw.parent === raw.id &&
              linkRaw.parenttype === parentType &&
              linkRaw.project === projectId
            );
          });

          belongs = !!linkMatch;

          if (linkMatch) {
            console.log(
              `      🔗 Matched via project link ${linkMatch.id} (parenttype=${parentType})`
            );
          }
        }
      }

      console.log(`   ↪️ Record #${index + 1} id=${raw?.id} → ${belongs ? 'KEEP' : 'SKIP'}`, raw);
      return belongs;
    });

    console.log('✅ [FILTER] Filtered records count:', filtered.length);
    return filtered;
  } catch (err) {
    console.error('❌ [FILTER] Error during project filtering:', err);
    // Fallback: return original records to avoid breaking flow
    return records;
  }
}

/**
 * Process age groups for dropdown display
 * Handles WatermelonDB model objects with proper field mapping
 */
export const processAgeGroups = (ageGroups, projectId = null, projectLinks = []) => {
  // Apply project filtering via project links
  const filteredGroups = filterByProject(ageGroups, projectId, projectLinks);

  if (!filteredGroups || filteredGroups.length === 0) {
    console.log('🔍 [CITIZEN_REPORT] Age groups - no data available');
    return [];
  }

  // Handle WatermelonDB model objects - access properties via getters
  const result = filteredGroups
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
export const processCitizenGroupsByType = (
  citizenGroups,
  groupType,
  projectId = null,
  projectLinks = []
) => {
  const filteredCitizenGroups = filterByProject(citizenGroups, projectId, projectLinks);

  if (!filteredCitizenGroups || filteredCitizenGroups.length === 0) {
    console.log(`🔍 [CITIZEN_REPORT] Citizen groups type ${groupType} - no data available`);
    return [];
  }

  // Handle WatermelonDB model objects and filter for specific group_type
  const result = filteredCitizenGroups
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
export const processCategories = (categories, projectId = null, projectLinks = []) => {
  // Filter by project if provided

  const filtered = filterByProject(categories, projectId, projectLinks);
  if (!filtered || filtered.length === 0) {
    console.log('🔍 [CITIZEN_REPORT] Categories - no data available after project filter');
    return [];
  }

  console.log(' LOOKUP UTIL Categories', filtered);

  const result = filtered
    .filter((category) => category && category.id) // Ensure valid records
    .map((category) => {
      // Handle both WatermelonDB model objects and raw data
      const rawData = category._raw || category;

      return {
        // Use Frappe's native structure
        id: rawData.id,
        name: rawData.id, // Frappe uses id as name
        confidentiality_level: rawData.confidentialityLevel || rawData.confidentiality_level,
        assigned_department: rawData.assignedDepartment || rawData.assigned_department,
        administrative_level: rawData.administrativeLevel || rawData.administrative_level,
        categoryName: rawData.categoryName || rawData.category_name,
        // Keep reference to original model
        _model: category,
      };
    });

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
export const processTypes = (types, projectId = null, projectLinks = []) => {
  const filtered = filterByProject(types, projectId, projectLinks);
  if (!filtered || filtered.length === 0) {
    console.log('🔍 [CITIZEN_REPORT] Types - no data available after project filter');
    return [];
  }

  const result = filtered
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

  // Handle both WatermelonDB model objects and raw data
  const rawData = category._raw || category;

  const processedCategory = {
    id: rawData.id,
    name: rawData.id, // Frappe uses id as name
    confidentiality_level: rawData.confidentialityLevel || rawData.confidentiality_level,
    assigned_department: rawData.assignedDepartment || rawData.assigned_department,
    administrative_level: rawData.administrativeLevel || rawData.administrative_level,
    categoryName: rawData.categoryName || rawData.category_name,
  };

  console.log('🔍 [CITIZEN_REPORT] Selected category:', processedCategory);
  return processedCategory;
};

/**
 * Process regions for location step dropdown display
 * Handles WatermelonDB model objects with proper hierarchical structure
 */
export const processRegions = (regions, projectId = null) => {
  const filtered = filterByProject(regions, projectId);
  if (!filtered || filtered.length === 0) {
    console.log('🔍 [CITIZEN_REPORT] Regions - no data available after project filter');
    return [];
  }

  const result = filtered
    .filter((region) => region && region.id) // Ensure valid records
    .map((region) => ({
      // Use Frappe's native structure
      id: region.id,
      regionName: region.regionName,
      parentRegion: region.parentRegion, // Updated field name
      administrativeLevel: region.administrativeLevel, // Updated field name
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
export const createNavigationData = (stepOneParams, additionalData = {}) => ({
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
});

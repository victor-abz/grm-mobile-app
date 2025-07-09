# Lookup Data & User Context Usage Guide

## Table of Contents
1. [Overview](#overview)
2. [Available Lookup Data Types](#available-lookup-data-types)
3. [Getting Lookup Data](#getting-lookup-data)
4. [Processing Lookup Data](#processing-lookup-data)
5. [User Context](#user-context)
6. [Creating Lookup Maps](#creating-lookup-maps)
7. [Best Practices](#best-practices)
8. [Common Patterns](#common-patterns)
9. [Troubleshooting](#troubleshooting)

## Overview

The GRM mobile application uses a comprehensive lookup data. This guide explains how to access and use this data effectively.

### Key Concepts
- **Lookup Data**: Reference data like categories, types, statuses, etc.
- **User Context**: User permissions, assignments, and accessible resources
- **Reactive Data**: Data that automatically updates when changed in the database
- **Project Filtering**: Filtering data based on user's assigned projects

## Available Lookup Data Types

### Core Issue Data
```javascript
// Issue Categories
{
  id: "CAT-001",
  categoryName: "Infrastructure",
  confidentialityLevel: "Public",
  assignedDepartment: "DEPT-001",
  administrativeLevel: "District"
}

// Issue Types
{
  id: "TYPE-001",
  typeName: "Road Maintenance"
}

// Issue Statuses
{
  id: "STATUS-001",
  statusName: "Open",
  initialStatus: true,
  finalStatus: false,
  openStatus: true
}
```

### Geographic Data
```javascript
// Administrative Regions
{
  id: "REGION-001",
  regionName: "Kigali City",
  administrativeLevel: "City",
  parentRegion: null,
  project: "PROJECT-001"
}
```

### User & Organizational Data
```javascript
// Age Groups
{
  id: "AGE-001",
  ageGroup: "18-25"
}

// Citizen Groups
{
  id: "CG-001",
  groupName: "Youth",
  groupType: "1" // Type 1 or Type 2
}

// Departments
{
  id: "DEPT-001",
  departmentName: "Infrastructure Department",
  head: "USER-001"
}

// Projects
{
  id: "PROJECT-001",
  title: "Kigali Development Project",
  projectCode: "KDP-2024",
  description: "Urban development initiative",
  isActive: true
}

// Users
{
  id: "USER-001",
  username: "john.doe",
  email: "john.doe@example.com",
  fullName: "John Doe"
}
```

## Getting Lookup Data

### Method 1: Using DataProvider (Recommended)
```javascript
import { useData } from '../../../providers/DataProvider';

function MyComponent() {
  const { lookupData, isDataInitialized } = useData();
  
  // Wait for data to be loaded
  if (!isDataInitialized) {
    return <LoadingSpinner />;
  }
  
  // Access all lookup data
  const {
    categories,
    types,
    statuses,
    regions,
    ageGroups,
    citizenGroups,
    departments,
    projects
  } = lookupData;
  
  return <YourComponent />;
}
```

### Method 2: Using withObservables (For Reactive Data)
```javascript
import { withObservables } from '@nozbe/watermelondb/react';
import watermelonManager from '../../../database/watermelonManager';

function MyComponent({ categories, types, statuses }) {
  // Component receives reactive data as props
  console.log(`Found ${categories.length} categories`);
  
  return <YourComponent />;
}

// Enhanced with observables
const enhance = withObservables([], () => ({
  categories: watermelonManager.getDatabase().get('grm_issue_categories').query().observe(),
  types: watermelonManager.getDatabase().get('grm_issue_types').query().observe(),
  statuses: watermelonManager.getDatabase().get('grm_issue_statuses').query().observe(),
}));

export default enhance(MyComponent);
```

### Method 3: Direct Access via LookupDataManager
```javascript
import lookupDataManager from '../../../services/LookupDataManager';

async function loadData() {
  const categories = await lookupDataManager.getCategories();
  const types = await lookupDataManager.getTypes();
  const statuses = await lookupDataManager.getStatuses();
  
  console.log('Loaded lookup data:', { categories, types, statuses });
}
```

## Processing Lookup Data

### Using Shared Utilities (Recommended)
```javascript
import {
  processCategories,
  processTypes,
  processAgeGroups,
  processCitizenGroupsByType,
  processRegions
} from '../../../utils/citizenReportUtils';

function MyComponent({ categories, types, ageGroups, citizenGroups, regions, projectLinks }) {
  const projectId = "PROJECT-001";
  
  // Process data with project filtering
  const processedCategories = useMemo(() => {
    return processCategories(categories, projectId, projectLinks);
  }, [categories, projectId, projectLinks]);
  
  const processedTypes = useMemo(() => {
    return processTypes(types, projectId, projectLinks);
  }, [types, projectId, projectLinks]);
  
  const processedAgeGroups = useMemo(() => {
    return processAgeGroups(ageGroups, projectId, projectLinks);
  }, [ageGroups, projectId, projectLinks]);
  
  // Process citizen groups by type (1 or 2)
  const citizenGroupsType1 = useMemo(() => {
    return processCitizenGroupsByType(citizenGroups, 1, projectId, projectLinks);
  }, [citizenGroups, projectId, projectLinks]);
  
  const citizenGroupsType2 = useMemo(() => {
    return processCitizenGroupsByType(citizenGroups, 2, projectId, projectLinks);
  }, [citizenGroups, projectId, projectLinks]);
  
  const processedRegions = useMemo(() => {
    return processRegions(regions, projectId);
  }, [regions, projectId]);
  
  return <YourComponent />;
}
```

### Manual Processing
```javascript
function processDataManually(rawData, projectId, projectLinks) {
  // Filter by project if provided
  let filtered = rawData;
  
  if (projectId) {
    filtered = rawData.filter(item => {
      const raw = item._raw || item;
      
      // Direct project field
      if (raw.project === projectId) return true;
      
      // Check project links for child table relationships
      const hasProjectLink = projectLinks.some(link => {
        const linkRaw = link._raw || link;
        return linkRaw.parent === raw.id && 
               linkRaw.project === projectId;
      });
      
      return hasProjectLink;
    });
  }
  
  // Transform to consistent format
  return filtered.map(item => {
    const raw = item._raw || item;
    return {
      id: raw.id,
      name: raw.id, // Frappe uses id as name
      label: raw.categoryName || raw.typeName || raw.statusName || raw.id,
      // Include original data
      ...raw
    };
  });
}
```

## User Context

### Getting User Context
```javascript
import { useData } from '../../../providers/DataProvider';

function MyComponent() {
  const { dataManager } = useData();
  const [userContext, setUserContext] = useState(null);
  
  useEffect(() => {
    const loadUserContext = async () => {
      if (dataManager) {
        const context = dataManager.getUserContext();
        setUserContext(context);
      }
    };
    
    loadUserContext();
  }, [dataManager]);
  
  if (!userContext) {
    return <LoadingSpinner />;
  }
  
  return <YourComponent userContext={userContext} />;
}
```

### User Context Structure
```javascript
const userContext = {
  // Basic user information
  user: {
    id: "USER-001",
    name: "john.doe",
    email: "john.doe@example.com",
    fullName: "John Doe"
  },
  
  // Projects user has access to
  accessible_projects: [
    {
      id: "PROJECT-001",
      name: "Kigali Development Project",
      role: "Manager"
    }
  ],
  
  // Regions user can access
  accessible_regions: [
    {
      id: "REGION-001",
      name: "Kigali City",
      level: "City"
    }
  ],
  
  // User's role assignments
  assignments: [
    {
      project: "PROJECT-001",
      region: "REGION-001",
      department: "DEPT-001",
      role: "Manager",
      administrative_level: "District"
    }
  ],
  
  // User permissions
  permissions: {
    can_create_issues: true,
    can_assign_issues: true,
    can_resolve_issues: false,
    can_escalate_issues: true
  }
};
```

### Using User Context for Filtering
```javascript
function filterDataByUserAccess(data, userContext) {
  if (!userContext || !userContext.accessible_projects) {
    return data;
  }
  
  const accessibleProjectIds = userContext.accessible_projects.map(p => p.id);
  
  return data.filter(item => {
    const raw = item._raw || item;
    return accessibleProjectIds.includes(raw.project);
  });
}
```

## Creating Lookup Maps

### Using Shared Utility
```javascript
import { createLookupMap } from '../../../utils/issueDetailUtils';

function MyComponent({ categories, types, statuses }) {
  // Create lookup maps for efficient ID-to-label resolution
  const lookupMaps = useMemo(() => ({
    categoryMap: createLookupMap(categories, 'categoryName'),
    typeMap: createLookupMap(types, 'typeName'),
    statusMap: createLookupMap(statuses, 'statusName'),
  }), [categories, types, statuses]);
  
  // Use maps to resolve labels
  const categoryLabel = lookupMaps.categoryMap.get('CAT-001') || 'Unknown';
  const typeLabel = lookupMaps.typeMap.get('TYPE-001') || 'Unknown';
  
  return <YourComponent />;
}
```

### Manual Lookup Map Creation
```javascript
function createLookupMapManually(items, labelField) {
  const map = new Map();
  
  if (!items || !Array.isArray(items)) return map;
  
  items.forEach(item => {
    const rawItem = item._raw || item;
    if (rawItem && rawItem.id) {
      const label = rawItem[labelField] || rawItem.name || rawItem.id;
      map.set(rawItem.id, label);
    }
  });
  
  return map;
}
```

## Best Practices

### 1. Always Use Memoization
```javascript
// ✅ Good - Memoized processing
const processedData = useMemo(() => {
  return processCategories(categories, projectId, projectLinks);
}, [categories, projectId, projectLinks]);

// ❌ Bad - Reprocessed on every render
const processedData = processCategories(categories, projectId, projectLinks);
```

### 2. Handle Loading States
```javascript
function MyComponent({ categories }) {
  // Show loading while data is being fetched
  if (!categories || categories.length === 0) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#24c38b" />
        <Text>Loading categories...</Text>
      </View>
    );
  }
  
  return <YourComponent />;
}
```

### 3. Provide Fallbacks
```javascript
// Always provide fallback values
const categoryLabel = lookupMaps.categoryMap.get(categoryId) || 
                     categoryId || 
                     t('information_not_available');
```

### 4. Use Consistent Data Structure
```javascript
// Process data to consistent format for dropdowns
const dropdownItems = processedCategories.map(category => ({
  label: category.categoryName || category.id,
  value: category.id,
  _model: category // Keep reference to original
}));
```

## Common Patterns

### 1. Dropdown Data Preparation
```javascript
function prepareDropdownData(rawData, labelField, valueField = 'id') {
  return rawData
    .filter(item => item && item.id) // Ensure valid records
    .map(item => {
      const raw = item._raw || item;
      return {
        label: raw[labelField] || raw.id,
        value: raw[valueField],
        _model: item // Keep reference
      };
    });
}

// Usage
const categoryItems = prepareDropdownData(processedCategories, 'categoryName');
```

### 2. Issue Data Enrichment
```javascript
import { enrichIssueData, createDetailLookupMaps } from '../../../utils/issueDetailUtils';

function enrichIssueWithLabels(issue, lookupData, t) {
  const lookupMaps = createDetailLookupMaps(lookupData);
  return enrichIssueData(issue, lookupMaps, t);
}

// Usage
const enrichedIssue = enrichIssueWithLabels(rawIssue, {
  categories,
  types,
  statuses,
  ageGroups,
  citizenGroups,
  regions,
  projects,
  users
}, t);

console.log(enrichedIssue.categoryLabel); // "Infrastructure"
console.log(enrichedIssue.statusLabel);   // "Open"
```

### 3. Project-Based Filtering
```javascript
function useProjectFilteredData(rawData, projectId, projectLinks) {
  return useMemo(() => {
    if (!projectId) return rawData;
    
    return rawData.filter(item => {
      const raw = item._raw || item;
      
      // Direct project association
      if (raw.project === projectId) return true;
      
      // Check project links for child table relationships
      return projectLinks.some(link => {
        const linkRaw = link._raw || link;
        return linkRaw.parent === raw.id && linkRaw.project === projectId;
      });
    });
  }, [rawData, projectId, projectLinks]);
}
```

### 4. User Access Validation
```javascript
function hasUserAccess(userContext, resourceType, resourceId) {
  if (!userContext) return false;
  
  switch (resourceType) {
    case 'project':
      return userContext.accessible_projects?.some(p => p.id === resourceId);
    
    case 'region':
      return userContext.accessible_regions?.some(r => r.id === resourceId);
    
    case 'department':
      return userContext.assignments?.some(a => a.department === resourceId);
    
    default:
      return false;
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Empty Lookup Data
```javascript
// Check if data is loaded
if (!categories || categories.length === 0) {
  console.log('Categories not loaded yet or empty');
  // Show loading state or error message
}

// Check data structure
console.log('First category:', categories[0]);
console.log('Category fields:', Object.keys(categories[0] || {}));
```

#### 2. Lookup Map Not Finding Values
```javascript
// Debug lookup map
console.log('Lookup map size:', categoryMap.size);
console.log('Available keys:', Array.from(categoryMap.keys()));
console.log('Looking for:', categoryId);
console.log('Found:', categoryMap.get(categoryId));

// Check data format
const sampleCategory = categories[0];
console.log('Sample category:', {
  id: sampleCategory.id,
  categoryName: sampleCategory.categoryName,
  _raw: sampleCategory._raw
});
```

#### 3. User Context Issues
```javascript
// Debug user context
console.log('User context:', userContext);
console.log('Has user:', !!userContext?.user);
console.log('Accessible projects:', userContext?.accessible_projects?.length || 0);
console.log('Assignments:', userContext?.assignments?.length || 0);
```

#### 4. Project Filtering Not Working
```javascript
// Debug project filtering
console.log('Project ID:', projectId);
console.log('Project Links count:', projectLinks?.length || 0);
console.log('Raw data count:', rawData?.length || 0);

// Check project links structure
if (projectLinks?.length > 0) {
  console.log('Sample project link:', {
    parent: projectLinks[0].parent,
    project: projectLinks[0].project,
    parenttype: projectLinks[0].parenttype
  });
}
```

### Performance Tips

1. **Use memoization** for expensive operations
2. **Limit re-renders** by stable dependencies
3. **Filter data early** to reduce processing
4. **Cache lookup maps** when possible
5. **Use reactive observables** for automatic updates

### Debugging Commands

```javascript
// In browser console or React Native debugger
console.log('Lookup data status:', {
  categories: window.lookupData?.categories?.length || 0,
  types: window.lookupData?.types?.length || 0,
  statuses: window.lookupData?.statuses?.length || 0
});

// Check WatermelonDB directly
const db = require('./database/watermelonManager').default.getDatabase();
db.get('grm_issue_categories').query().fetch().then(console.log);
``` 
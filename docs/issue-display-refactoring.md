# Issue Display Refactoring Guide

## Overview

This guide provides comprehensive instructions for refactoring the Issue Search and Issue Detail components to use WatermelonDB data directly through `withObservables`, properly handle lookup data relationships, and display meaningful labels instead of raw IDs while preserving all existing UI layouts.

## Objectives

1. **Direct WatermelonDB Integration**: Use `withObservables` for reactive data access
2. **Lookup Data Resolution**: Display labels from related tables instead of raw IDs
3. **No Data Transformers**: Eliminate complex data transformation layers
4. **Preserve UI Layouts**: Keep all existing UI components and styling unchanged
5. **Real-time Updates**: Ensure reactive updates when data changes

## Files to Modify

### Primary Files
- `/Users/victor/Documents/dev/grm-mobile-app/src/screens/Home/IssueSearch/IssueSearch.js`
- `/Users/victor/Documents/dev/grm-mobile-app/src/screens/Home/IssueSearch/containers/Content.js`
- `/Users/victor/Documents/dev/grm-mobile-app/src/screens/Home/IssueDetail/IssueDetail.js`
- `/Users/victor/Documents/dev/grm-mobile-app/src/screens/Home/IssueDetail/containers/Content.js`

### Reference Files
- `/Users/victor/Documents/dev/grm-mobile-app/docs/using-lookup.md` (for lookup data patterns)
- `/Users/victor/Documents/dev/grm-mobile-app/src/database/models/grm_issue.js` (for field mappings)
- `/Users/victor/Documents/dev/grm-mobile-app/src/database/schema.js` (for table relationships)

## Database Relationships Mapping

Based on the GRM Issue model, here are the key lookup relationships to resolve:

```js
// From grm_issue.js model
@relation("grm_projects", "project_id") project;
@relation("grm_issue_categories", "category_id") category;
@relation("grm_issue_types", "issue_type_id") issueType;
@relation("grm_issue_statuses", "status_id") status;
@relation("grm_issue_age_groups", "citizen_age_group_id") citizenAgeGroup;
@relation("grm_issue_citizen_groups", "citizen_group_1_id") citizenGroup1;
@relation("grm_issue_citizen_groups", "citizen_group_2_id") citizenGroup2;
@relation("users", "reporter_id") reporter;
@relation("users", "assignee_id") assignee;
@relation("grm_administrative_regions", "administrative_region_id") administrativeRegion;
```

## Display Field Mappings

| Field in Issue | Related Table | Display Field | Model Getter |
|----------------|---------------|---------------|--------------|
| `category_id` | `grm_issue_categories` | Category Name | `categoryName` |
| `issue_type_id` | `grm_issue_types` | Type Name | `typeName` |
| `status_id` | `grm_issue_statuses` | Status Name | `statusName` |
| `citizen_age_group_id` | `grm_issue_age_groups` | Age Group | `ageGroup` |
| `citizen_group_1_id` | `grm_issue_citizen_groups` | Group Name | `groupName` |
| `citizen_group_2_id` | `grm_issue_citizen_groups` | Group Name | `groupName` |
| `administrative_region_id` | `grm_administrative_regions` | Region Name | `regionName` |
| `project_id` | `grm_projects` | Project Title | `title` |
| `reporter_id` | `users` | User Name | `full_name` or `name` |
| `assignee_id` | `users` | User Name | `full_name` or `name` |

## Implementation Strategy

### Phase 1: IssueSearch.js Refactoring

#### 1.1 Update withObservables in IssueSearch.js

```js
// File: /Users/victor/Documents/dev/grm-mobile-app/src/screens/Home/IssueSearch/IssueSearch.js

const enhance = withObservables([], () => {
  try {
    return {
      // Primary data
      issues: watermelonManager.observeIssues({}),
      
      // Lookup data for label resolution
      categories: watermelonManager.getDatabase().get('grm_issue_categories').query().observe(),
      types: watermelonManager.getDatabase().get('grm_issue_types').query().observe(),
      statuses: watermelonManager.getDatabase().get('grm_issue_statuses').query().observe(),
      ageGroups: watermelonManager.getDatabase().get('grm_issue_age_groups').query().observe(),
      citizenGroups: watermelonManager.getDatabase().get('grm_issue_citizen_groups').query().observe(),
      regions: watermelonManager.getDatabase().get('grm_administrative_regions').query().observe(),
      projects: watermelonManager.getDatabase().get('grm_projects').query().observe(),
      // Note: Users table may need to be added to schema if not present
    };
  } catch (error) {
    console.error('Error setting up WatermelonDB observables:', error);
    return {
      issues: { subscribe: () => ({ unsubscribe: () => {} }) },
      categories: { subscribe: () => ({ unsubscribe: () => {} }) },
      types: { subscribe: () => ({ unsubscribe: () => {} }) },
      statuses: { subscribe: () => ({ unsubscribe: () => {} }) },
      ageGroups: { subscribe: () => ({ unsubscribe: () => {} }) },
      citizenGroups: { subscribe: () => ({ unsubscribe: () => {} }) },
      regions: { subscribe: () => ({ unsubscribe: () => {} }) },
      projects: { subscribe: () => ({ unsubscribe: () => {} }) },
    };
  }
});
```

#### 1.2 Update Component Props

```js
// Update function signature
function IssueSearch({ 
  issues = [], 
  categories = [],
  types = [],
  statuses = [],
  ageGroups = [],
  citizenGroups = [],
  regions = [],
  projects = []
}) {
  // Pass all lookup data to Content component
  return (
    <SafeAreaView style={customStyles.container}>
      <Content 
        issues={issues} 
        eadl={eadl} 
        categories={categories}
        types={types}
        statuses={statuses}
        ageGroups={ageGroups}
        citizenGroups={citizenGroups}
        regions={regions}
        projects={projects}
      />
    </SafeAreaView>
  );
}
```

### Phase 2: IssueSearch Content.js Enhancement

#### 2.1 Create Lookup Helper Functions

```js
// File: /Users/victor/Documents/dev/grm-mobile-app/src/screens/Home/IssueSearch/containers/Content.js

// Add these helper functions to resolve IDs to labels
const createLookupMap = (items, labelField) => {
  const map = new Map();
  items.forEach(item => {
    if (item && item.id) {
      map.set(item.id, item[labelField] || item.id);
    }
  });
  return map;
};

const useLookupMaps = (categories, types, statuses, ageGroups, citizenGroups, regions, projects) => {
  return useMemo(() => ({
    categoryMap: createLookupMap(categories, 'categoryName'),
    typeMap: createLookupMap(types, 'typeName'),
    statusMap: createLookupMap(statuses, 'statusName'),
    ageGroupMap: createLookupMap(ageGroups, 'ageGroup'),
    citizenGroupMap: createLookupMap(citizenGroups, 'groupName'),
    regionMap: createLookupMap(regions, 'regionName'),
    projectMap: createLookupMap(projects, 'title'),
  }), [categories, types, statuses, ageGroups, citizenGroups, regions, projects]);
};
```

#### 2.2 Process Issues with Label Resolution

```js
// Add this function to enrich issues with labels
const enrichIssuesWithLabels = (issues, lookupMaps) => {
  return useMemo(() => {
    if (!issues || issues.length === 0) return [];

    return issues.map(issue => ({
      // Keep all original issue data
      ...issue,
      
      // Add resolved labels for display
      categoryLabel: lookupMaps.categoryMap.get(issue.category_id) || issue.category_id,
      typeLabel: lookupMaps.typeMap.get(issue.issue_type_id) || issue.issue_type_id,
      statusLabel: lookupMaps.statusMap.get(issue.status_id) || issue.status_id,
      ageGroupLabel: lookupMaps.ageGroupMap.get(issue.citizen_age_group_id) || issue.citizen_age_group_id,
      citizenGroup1Label: lookupMaps.citizenGroupMap.get(issue.citizen_group_1_id) || issue.citizen_group_1_id,
      citizenGroup2Label: lookupMaps.citizenGroupMap.get(issue.citizen_group_2_id) || issue.citizen_group_2_id,
      regionLabel: lookupMaps.regionMap.get(issue.administrative_region_id) || issue.administrative_region_id,
      projectLabel: lookupMaps.projectMap.get(issue.project_id) || issue.project_id,
      
      // Format dates for display
      issueDateFormatted: issue.issue_date ? moment(issue.issue_date).format('DD-MMM-YYYY') : '',
      intakeDateFormatted: issue.intake_date ? moment(issue.intake_date).format('DD-MMM-YYYY') : '',
    }));
  }, [issues, lookupMaps]);
};
```

#### 2.3 Update Content Component

```js
function Content({ 
  issues, 
  eadl, 
  categories = [],
  types = [],
  statuses = [],
  ageGroups = [],
  citizenGroups = [],
  regions = [],
  projects = []
}) {
  // Create lookup maps
  const lookupMaps = useLookupMaps(categories, types, statuses, ageGroups, citizenGroups, regions, projects);
  
  // Enrich issues with labels
  const enrichedIssues = enrichIssuesWithLabels(issues, lookupMaps);
  
  // Rest of component logic remains unchanged
  // Use enrichedIssues instead of issues for display
  // Access labels via: issue.categoryLabel, issue.typeLabel, etc.
}
```

### Phase 3: IssueDetail.js Refactoring

#### 3.1 Update IssueDetail.js with withObservables

```js
// File: /Users/victor/Documents/dev/grm-mobile-app/src/screens/Home/IssueDetail/IssueDetail.js

import React from "react";
import { SafeAreaView } from "react-native";
import { withObservables } from '@nozbe/watermelondb/react';
import watermelonManager from '../../../database/watermelonManager';
import Content from "./containers/Content";
import { styles } from "./IssueDetail.styles";

const IssueDetail = ({ route, issue, categories, types, statuses, ageGroups, citizenGroups, regions, projects }) => {
  const { params } = route;
  const customStyles = styles();

  // Get the issue from route params or from the observable
  const issueData = issue || params.item;

  return (
    <SafeAreaView style={customStyles.container}>
      <Content 
        issue={issueData}
        categories={categories}
        types={types}
        statuses={statuses}
        ageGroups={ageGroups}
        citizenGroups={citizenGroups}
        regions={regions}
        projects={projects}
      />
    </SafeAreaView>
  );
};

// Enhanced withObservables to get issue and all lookup data
const enhance = withObservables(['route'], ({ route }) => {
  const issueId = route?.params?.issueId || route?.params?.item?.id;
  
  try {
    const observables = {
      // Lookup data for label resolution
      categories: watermelonManager.getDatabase().get('grm_issue_categories').query().observe(),
      types: watermelonManager.getDatabase().get('grm_issue_types').query().observe(),
      statuses: watermelonManager.getDatabase().get('grm_issue_statuses').query().observe(),
      ageGroups: watermelonManager.getDatabase().get('grm_issue_age_groups').query().observe(),
      citizenGroups: watermelonManager.getDatabase().get('grm_issue_citizen_groups').query().observe(),
      regions: watermelonManager.getDatabase().get('grm_administrative_regions').query().observe(),
      projects: watermelonManager.getDatabase().get('grm_projects').query().observe(),
    };

    // If we have an issueId, observe the specific issue
    if (issueId) {
      observables.issue = watermelonManager.getDatabase().get('grm_issues')
        .query(Q.where('id', issueId)).observe();
    }

    return observables;
  } catch (error) {
    console.error('Error setting up IssueDetail observables:', error);
    return {
      issue: { subscribe: () => ({ unsubscribe: () => {} }) },
      categories: { subscribe: () => ({ unsubscribe: () => {} }) },
      types: { subscribe: () => ({ unsubscribe: () => {} }) },
      statuses: { subscribe: () => ({ unsubscribe: () => {} }) },
      ageGroups: { subscribe: () => ({ unsubscribe: () => {} }) },
      citizenGroups: { subscribe: () => ({ unsubscribe: () => {} }) },
      regions: { subscribe: () => ({ unsubscribe: () => {} }) },
      projects: { subscribe: () => ({ unsubscribe: () => {} }) },
    };
  }
});

export default enhance(IssueDetail);
```

#### 3.2 Update IssueDetail Content.js

```js
// File: /Users/victor/Documents/dev/grm-mobile-app/src/screens/Home/IssueDetail/containers/Content.js

function Content({ 
  issue, 
  categories = [],
  types = [],
  statuses = [],
  ageGroups = [],
  citizenGroups = [],
  regions = [],
  projects = []
}) {
  // Create lookup maps (same as IssueSearch)
  const lookupMaps = useLookupMaps(categories, types, statuses, ageGroups, citizenGroups, regions, projects);
  
  // Enrich single issue with labels
  const enrichedIssue = useMemo(() => {
    if (!issue) return null;
    
    // Handle both array from observable and single issue object
    const issueData = Array.isArray(issue) ? issue[0] : issue;
    if (!issueData) return null;

    return {
      // Keep all original issue data
      ...issueData,
      
      // Add resolved labels for display
      categoryLabel: lookupMaps.categoryMap.get(issueData.category_id) || issueData.category_id,
      typeLabel: lookupMaps.typeMap.get(issueData.issue_type_id) || issueData.issue_type_id,
      statusLabel: lookupMaps.statusMap.get(issueData.status_id) || issueData.status_id,
      ageGroupLabel: lookupMaps.ageGroupMap.get(issueData.citizen_age_group_id) || issueData.citizen_age_group_id,
      citizenGroup1Label: lookupMaps.citizenGroupMap.get(issueData.citizen_group_1_id) || issueData.citizen_group_1_id,
      citizenGroup2Label: lookupMaps.citizenGroupMap.get(issueData.citizen_group_2_id) || issueData.citizen_group_2_id,
      regionLabel: lookupMaps.regionMap.get(issueData.administrative_region_id) || issueData.administrative_region_id,
      projectLabel: lookupMaps.projectMap.get(issueData.project_id) || issueData.project_id,
      
      // Format dates for display
      issueDateFormatted: issueData.issue_date ? moment(issueData.issue_date).format('DD-MMM-YYYY HH:mm') : '',
      intakeDateFormatted: issueData.intake_date ? moment(issueData.intake_date).format('DD-MMM-YYYY HH:mm') : '',
    };
  }, [issue, lookupMaps]);

  // Loading state
  if (!enrichedIssue) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Loading issue details...</Text>
      </View>
    );
  }

  // Rest of component logic remains unchanged
  // Use enrichedIssue.categoryLabel, enrichedIssue.typeLabel, etc. for display
}
```

## Navigation Updates

### Update Navigation to IssueDetail

```js
// In IssueSearch or any component navigating to IssueDetail
navigation.navigate('IssueDetail', {
  issueId: issue.id, // Pass the issue ID
  item: {
    // Pass minimal issue data for backward compatibility
    id: issue.id,
    tracking_code: issue.tracking_code,
    // Don't pass the full issue object to avoid circular references
  }
});
```

## Critical DOs and DON'Ts

### ✅ DOs

1. **Preserve UI Layouts**: Keep all existing JSX structure, styling, and component arrangements
2. **Use WatermelonDB Model Getters**: Access fields via model getters (e.g., `category.categoryName`)
3. **Create Lookup Maps**: Use efficient Map objects for ID-to-label resolution
4. **Handle Arrays from Observables**: Check if data is array and extract appropriately
5. **Add Loading States**: Show loading indicators while data is being fetched
6. **Use useMemo**: Optimize lookup map creation and issue enrichment
7. **Preserve Original Data**: Keep all original issue fields alongside enriched labels
8. **Handle Null/Undefined**: Provide fallbacks for missing lookup data

### ❌ DON'Ts

1. **Don't Change UI Components**: No modifications to existing styling or layout components
2. **Don't Use Complex Transformers**: Avoid heavy data manipulation layers
3. **Don't Create Artificial IDs**: Use Frappe's native `name` field as identifier
4. **Don't Pass WatermelonDB Models in Navigation**: Extract only essential data for navigation
5. **Don't Ignore Loading States**: Always handle the case when data isn't loaded yet
6. **Don't Hardcode Labels**: Always resolve from lookup tables
7. **Don't Break Existing Props**: Maintain backward compatibility with existing prop names

## Testing Checklist

- [ ] IssueSearch displays all issues with resolved labels
- [ ] Issue categories show names instead of IDs
- [ ] Issue types show names instead of IDs
- [ ] Issue statuses show names instead of IDs
- [ ] Administrative regions show names instead of IDs
- [ ] Navigation to IssueDetail works correctly
- [ ] IssueDetail shows individual issue with all resolved labels
- [ ] Real-time updates work when data changes in WatermelonDB
- [ ] Loading states display appropriately
- [ ] No console errors related to undefined properties
- [ ] Performance remains optimal with large issue lists

## Error Handling

```js
// Add proper error boundaries
const SafeLookupMap = (items, labelField) => {
  try {
    return createLookupMap(items, labelField);
  } catch (error) {
    console.warn(`Error creating lookup map for ${labelField}:`, error);
    return new Map();
  }
};

// Graceful label resolution
const getLabel = (map, id, fallback = 'Unknown') => {
  try {
    return map.get(id) || fallback;
  } catch (error) {
    console.warn(`Error getting label for ID ${id}:`, error);
    return fallback;
  }
};
```

## Performance Considerations

1. **Use useMemo**: Memoize lookup maps and enriched data
2. **Efficient Queries**: Use WatermelonDB queries instead of filtering in JS
3. **Minimal Re-renders**: Only update when underlying data changes
4. **Lazy Loading**: Consider pagination for large issue lists
5. **Memory Management**: Avoid memory leaks from unsubscribed observables

## Implementation Timeline

1. **Day 1**: Refactor IssueSearch.js with withObservables
2. **Day 2**: Update IssueSearch Content.js with lookup resolution
3. **Day 3**: Refactor IssueDetail.js with withObservables
4. **Day 4**: Update IssueDetail Content.js with lookup resolution
5. **Day 5**: Testing, debugging, and performance optimization

This comprehensive guide ensures that both IssueSearch and IssueDetail components use WatermelonDB data directly, resolve lookup relationships properly, and maintain all existing UI layouts while providing real-time reactive updates. 
# Using Lookup Data with withObservables

This document outlines the process for refactoring UI components to use reactive WatermelonDB observables instead of complex data transformers when working with Frappe backend data.

## Overview

The refactoring process involves:
1. Removing DataProvider dependencies
2. Implementing withObservables for reactive data
3. Eliminating complex data transformations
4. Using Frappe's native data structure with `name` as primary identifier
5. Properly handling WatermelonDB model objects

## Key Principles

### 1. Frappe Data Structure
- **Primary Identifier**: Always use `name` field as the unique identifier (stored as WatermelonDB `id`)
- **Display Fields**: Use the appropriate display field from the database schema
- **No Artificial IDs**: Avoid creating `_id`, `id`, `label`, `value` mappings

### 2. Database Schema Mapping
Before refactoring, always check the database schema (`src/database/schema.js`) to understand the field mapping:

```js
// Example: grm_issue_age_groups table
tableSchema({
  name: 'grm_issue_age_groups',
  columns: [
    { name: 'age_group', type: 'string' }, // Display field
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
  ],
})

// Example: grm_issue_citizen_groups table  
tableSchema({
  name: 'grm_issue_citizen_groups',
  columns: [
    { name: 'group_name', type: 'string' }, // Display field
    { name: 'group_type', type: 'string' }, // Filter field
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
  ],
})
```

### 3. Model Object Access
Check the model files (`src/database/models/`) to understand property getters:

```js
// grm_issue_age_group.js
export default class GrmIssueAgeGroup extends Model {
  static table = "grm_issue_age_groups";
  @field("age_group") ageGroup; // Getter for age_group field
  @date("created_at") createdAt;
  @date("updated_at") updatedAt;
}

// grm_issue_citizen_group.js  
export default class GrmIssueCitizenGroup extends Model {
  static table = "grm_issue_citizen_groups";
  @field("group_name") groupName; // Getter for group_name field
  @field("group_type") groupType; // Getter for group_type field
  @date("created_at") createdAt;
  @date("updated_at") updatedAt;
}
```

## Refactoring Process

### Step 1: Remove DataProvider Dependencies

**Before:**
```js
import { useData } from '../../../../providers/DataProvider';

function Content({ stepOneParams }) {
  const { lookupData, isDataInitialized, isLoading } = useData();
  // ... complex transformation logic
}
```

**After:**
```js
import { withObservables } from '@nozbe/watermelondb/react';
import watermelonManager from '../../../../database/watermelonManager';

function Content({ stepOneParams, ageGroups = [], citizenGroups = [] }) {
  // Direct reactive data from WatermelonDB
}
```

### Step 2: Implement withObservables

Add the withObservables HOC at the bottom of the component file:

```js
// Enhanced withObservables to provide reactive data from WatermelonDB
const enhance = withObservables([], () => ({
  ageGroups: watermelonManager.getDatabase().get('grm_issue_age_groups').query().observe(),
  citizenGroups: watermelonManager.getDatabase().get('grm_issue_citizen_groups').query().observe(),
  // Add other lookup data as needed
}));

export default enhance(Content);
```

### Step 3: Process WatermelonDB Model Objects

Handle WatermelonDB model objects correctly by accessing their properties via getters:

**Before (Complex Transformation):**
```js
const result = lookupData.ageGroups.map((ageGroup) => ({
  ...ageGroup,
  id: ageGroup._id || ageGroup.id,
  label: ageGroup.name,
  value: ageGroup._id || ageGroup.id,
}));
```

**After (Direct Model Access):**
```js
const processedAgeGroups = useMemo(() => {
  if (!ageGroups || ageGroups.length === 0) {
    return [];
  }

  // Handle WatermelonDB model objects - access properties via getters
  const result = ageGroups
    .filter((ageGroup) => ageGroup && ageGroup.id) // Ensure valid records
    .map((ageGroup) => ({
      // Use Frappe's native structure
      name: ageGroup.id, // Frappe primary identifier (stored as WatermelonDB id)
      label: ageGroup.ageGroup || ageGroup.id, // Display name from age_group field
      value: ageGroup.id, // Use name as value for form
      // Keep reference to original model
      _model: ageGroup,
    }));

  return result;
}, [ageGroups]);
```

### Step 4: Handle Filtered Data

For data that needs filtering (like citizen groups by type):

```js
const citizenGroupsI = useMemo(() => {
  if (!citizenGroups || citizenGroups.length === 0) {
    return [];
  }

  // Filter for group_type 1 and handle WatermelonDB model objects
  const result = citizenGroups
    .filter((group) => group && group.id && (group.groupType === '1' || group.groupType === 1))
    .map((group) => ({
      name: group.id, // Frappe primary identifier
      label: group.groupName || group.id, // Display from group_name field
      value: group.id, // Use name as value
      group_type: group.groupType,
      _model: group,
    }));

  return result;
}, [citizenGroups]);
```

### Step 5: Update Component Props

Update the component function signature to receive the observable data:

```js
// Before
function Content({ stepOneParams }) {

// After  
function Content({ stepOneParams, ageGroups = [], citizenGroups = [] }) {
```

### Step 6: Handle Loading States

Simplify loading state handling:

```js
// Show loading state while data is being loaded
if (!ageGroups.length && !citizenGroups.length) {
  return (
    <ScrollView>
      <View style={{ padding: 23, alignItems: 'center' }}>
        <Text style={styles.stepText}>{t('step_2')}</Text>
        <Text style={styles.stepSubtitle}>Loading data...</Text>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </ScrollView>
  );
}
```

### Step 7: Update Form Components

Use the processed data with proper schema mapping:

```js
<CustomDropDownPicker
  schema={{
    label: 'label', // Display field from processed data
    value: 'value', // Value field from processed data (Frappe name)
  }}
  placeholder={t('age_group_placeholder')}
  value={pickerAgeValue}
  items={processedAgeGroups}
  setPickerValue={setPickerAgeValue}
  onSelectItem={setSelectedAge}
/>
```

## Field Mapping Reference

Based on the database schema, here are the common field mappings:

| Table | Display Field | Model Getter | Schema Field |
|-------|---------------|--------------|--------------|
| `grm_issue_age_groups` | Age Group Name | `ageGroup` | `age_group_name` |
| `grm_issue_citizen_groups` | Group Name | `groupName` | `group_name` |
| `grm_issue_categories` | Category Name | `categoryName` | `category_name` |
| `grm_issue_types` | Type Name | `typeName` | `type_name` |
| `grm_issue_statuses` | Status Name | `statusName` | `status_name` |
| `grm_projects` | Title | `title` | `title` |
| `grm_administrative_regions` | Region Name | `regionName` | `region_name` |

## Data Flow

The new data flow is:

1. **Frappe Backend** → sends data with `name` as primary identifier
2. **WatermelonDB** → stores data with Frappe `name` as the record `id`
3. **withObservables** → provides reactive WatermelonDB model objects
4. **Component** → processes models into simple display format preserving Frappe structure
5. **Form Submission** → passes data with Frappe `name` identifiers to next step

## Common Issues and Solutions

### Issue: Accessing undefined properties
```js
// Wrong
label: group.group_name // undefined

// Correct
label: group.groupName // uses model getter
```

### Issue: Circular reference warnings in navigation
Keep only essential data when navigating:
```js
navigation.navigate('NextStep', {
  selectedItem: {
    name: selectedItem.name,
    label: selectedItem.label,
    // Don't pass _model reference
  }
});
```

### Issue: Empty dropdown items
Check the filter conditions and model property names:
```js
// Wrong
.filter((group) => group.group_type === '1')

// Correct  
.filter((group) => group.groupType === '1')
```

## Complete Example

Here's the complete refactored Contact page structure:

```js
import React, { useState, useCallback, useMemo } from 'react';
import { withObservables } from '@nozbe/watermelondb/react';
import watermelonManager from '../../../../database/watermelonManager';

function Content({ stepOneParams, ageGroups = [], citizenGroups = [] }) {
  // Form state
  const [selectedAge, setSelectedAge] = useState(null);
  
  // Process data
  const processedAgeGroups = useMemo(() => {
    return ageGroups
      .filter((ageGroup) => ageGroup && ageGroup.id)
      .map((ageGroup) => ({
        name: ageGroup.id,
        label: ageGroup.ageGroup || ageGroup.id,
        value: ageGroup.id,
        _model: ageGroup,
      }));
  }, [ageGroups]);

  // Loading state
  if (!ageGroups.length) {
    return <LoadingComponent />;
  }

  // Render form
  return (
    <CustomDropDownPicker
      schema={{ label: 'label', value: 'value' }}
      items={processedAgeGroups}
      onSelectItem={setSelectedAge}
    />
  );
}

// withObservables HOC
const enhance = withObservables([], () => ({
  ageGroups: watermelonManager.getDatabase().get('grm_issue_age_groups').query().observe(),
  citizenGroups: watermelonManager.getDatabase().get('grm_issue_citizen_groups').query().observe(),
}));

export default enhance(Content);
```

## Benefits

- **Real-time updates**: Changes in the database automatically reflect in the UI
- **Simplified data flow**: No complex transformation layers to debug
- **Frappe compatibility**: Data structure matches backend expectations
- **Performance**: Direct database queries instead of provider-managed state
- **Type safety**: WatermelonDB models provide better type checking
- **Maintainability**: Clearer data flow and fewer abstraction layers

## Next Steps

Apply this pattern to other components:
1. CitizenReportStep2 (categories and types)
2. CitizenReportLocationStep (regions)
3. CitizenReportStep3 (confirmation)
4. Any other components using lookup data

Each component should follow the same pattern: remove DataProvider, add withObservables, process model objects correctly, and maintain Frappe data structure. 
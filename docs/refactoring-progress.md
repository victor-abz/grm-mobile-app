# Lookup Data Refactoring Progress

This document tracks the progress of refactoring UI components to use withObservables instead of complex data transformers.

## Completed Pages

### ✅ Contact Page (`CitizenReportContactInfo/containers/Content.js`)

**Status**: COMPLETED ✅  
**Date**: January 24, 2025

**Changes Made**:
- ✅ Removed DataProvider dependency
- ✅ Implemented withObservables for `ageGroups` and `citizenGroups`
- ✅ Fixed citizen group 1 label to use `groupName` consistently
- ✅ Eliminated complex data transformations
- ✅ Used Frappe's native structure with `name` as primary identifier
- ✅ Proper WatermelonDB model object handling
- ✅ Added debugging logs for troubleshooting
- ✅ Fixed navigation to avoid circular reference warnings

**Data Sources**:
- `grm_issue_age_groups` → `ageGroup` field for display
- `grm_issue_citizen_groups` → `groupName` field for display, filtered by `groupType`

**Technical Implementation**:
```js
const enhance = withObservables([], () => ({
  ageGroups: watermelonManager.getDatabase().get('grm_issue_age_groups').query().observe(),
  citizenGroups: watermelonManager.getDatabase().get('grm_issue_citizen_groups').query().observe(),
}));
```

**Key Learnings**:
- WatermelonDB model objects use getters (e.g., `ageGroup.ageGroup`, `group.groupName`)
- Need to filter citizen groups by `groupType` ('1' or '2')
- Avoid passing `_model` references in navigation to prevent circular warnings
- Schema field names map to camelCase getters in model objects

---

## Pending Pages

### 🔄 Step 2 - Categories & Types (`CitizenReportStep2/containers/Content.js`)

**Status**: PENDING  
**Complexity**: Medium

**Required Changes**:
- [ ] Remove DataProvider dependency
- [ ] Implement withObservables for `categories` and `types`
- [ ] Update data processing to use model getters
- [ ] Handle category filtering logic
- [ ] Fix navigation data structure

**Data Sources**:
- `grm_issue_categories` → `categoryName` field for display
- `grm_issue_types` → `typeName` field for display

**Notes**: Currently uses complex transformation logic in `items` and `items2` useMemo hooks.

### 🔄 Location Step (`CitizenReportLocationStep/containers/Content.js`)

**Status**: PENDING  
**Complexity**: High

**Required Changes**:
- [ ] Remove DataProvider dependency
- [ ] Implement withObservables for `regions`
- [ ] Handle hierarchical region data
- [ ] Update region filtering and selection logic
- [ ] Maintain GPS location functionality

**Data Sources**:
- `grm_administrative_regions` → `regionName` field for display

**Notes**: Most complex due to hierarchical region structure and GPS integration.

### 🔄 Step 3 - Confirmation (`CitizenReportStep3/containers/Content.js`)

**Status**: PENDING  
**Complexity**: Low

**Required Changes**:
- [ ] Update to receive processed data from previous steps
- [ ] Ensure proper Frappe field mapping for issue creation
- [ ] Test end-to-end form submission

**Notes**: Mainly displays data from previous steps, minimal lookup data usage.

### 🔄 Step 4 - Success (`CitizenReportStep4/containers/Content.js`)

**Status**: PENDING  
**Complexity**: Very Low

**Required Changes**:
- [ ] Minimal changes needed, mainly displays success message

---

## Current Issues

### 🐛 Active Issues

1. **Age Group Label Issue** - ✅ RESOLVED
   - **Root Cause**: Backend sends `age_group_name` field, but mapping was looking for `age_group`
   - **Fix**: Updated `watermelonManager.js` to use `frappeData.age_group_name` instead of `frappeData.age_group`
   - **Impact**: Age group dropdowns now display correct labels ("60+", "35-60", etc.)
   
2. **Circular Reference Warning** - ✅ RESOLVED
   - Fixed by excluding `_model` references from navigation

### ⚠️ Known Warnings

1. **defaultProps Warning**: React Native component warning about defaultProps in memo components
   - Impact: Low (cosmetic warning)
   - Fix: Use JavaScript default parameters instead

---

## Testing Checklist

### Contact Page Testing

- [x] Age groups dropdown loads and displays correctly
- [x] Citizen groups I dropdown filters type '1' correctly
- [x] Citizen groups II dropdown filters type '2' correctly
- [x] Gender dropdown works as expected
- [x] Navigation to Step 2 passes correct data structure
- [x] Loading state displays when data is unavailable
- [x] Error state shows appropriate message
- [x] Real-time updates work when data changes in database

---

## Technical Notes

### Field Mapping Reference

| WatermelonDB Table | Schema Field | Model Getter | Display Purpose |
|-------------------|--------------|--------------|-----------------|
| `grm_issue_age_groups` | `age_group` | `ageGroup` | Age group name |
| `grm_issue_citizen_groups` | `group_name` | `groupName` | Citizen group name |
| `grm_issue_citizen_groups` | `group_type` | `groupType` | Filter criteria |
| `grm_issue_categories` | `category_name` | `categoryName` | Category name |
| `grm_issue_types` | `type_name` | `typeName` | Issue type name |
| `grm_administrative_regions` | `region_name` | `regionName` | Region name |

### withObservables Pattern

```js
const enhance = withObservables([], () => ({
  dataName: watermelonManager.getDatabase().get('table_name').query().observe(),
}));

export default enhance(Component);
```

### Data Processing Pattern

```js
const processedData = useMemo(() => {
  return rawData
    .filter((item) => item && item.id)
    .map((item) => ({
      name: item.id, // Frappe primary identifier
      label: item.displayField || item.id, // Proper display field
      value: item.id, // Form value
      // Additional fields as needed
    }));
}, [rawData]);
```

---

## Next Steps

1. **Immediate**: Refactor CitizenReportStep2 following the established pattern
2. **After Step 2**: Test complete flow from Contact → Step 2
3. **Then**: Continue with LocationStep (most complex)
4. **Finally**: Complete Step 3 and Step 4

## Documentation

- ✅ Created comprehensive `docs/using-lookup.md` guide
- ✅ Created progress tracking document
- [ ] Update component documentation after each refactor
- [ ] Create migration guide for other developers 
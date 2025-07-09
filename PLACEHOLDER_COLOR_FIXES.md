# Placeholder Color Fixes

## Problem
Placeholder text in input fields (TextInput, dropdowns, textareas) had the same color as the actual text (`#707070` or `#dedede`), making it difficult to distinguish between placeholder and actual input values.

## Solution
Implemented proper placeholder color hierarchy with better contrast:

- **New placeholder color**: `#b0b0b0` (darker gray for better visibility)
- **Alternative light placeholder**: `#c8c8c8` (for special cases)
- **Updated React Native Paper theme** to use proper placeholder colors

## Files Modified

### Core Configuration
1. **`src/utils/colors.js`**
   - Added `placeholder: "#b0b0b0"` and `placeholderLight: "#c8c8c8"`
   - Added `createInputTheme()` helper function

2. **`src/theme/index.js`**
   - Updated Paper theme with `placeholder: colors.placeholder`
   - Added `onSurfaceVariant: colors.placeholder` for Paper TextInput compatibility

### Component Theme Updates
Updated local theme objects to use `colors.placeholder` instead of hardcoded `#dedede`:

3. **`src/screens/Auth/Login/Login.js`**
4. **`src/screens/Auth/SignUp/SignUp.js`**
5. **`src/screens/Home/CitizenReportStep2/containers/Content.js`**
6. **`src/screens/Home/CitizenReport/containers/Content.js`**
7. **`src/screens/Home/CitizenReportContactInfo/containers/Content.js`**
8. **`src/screens/Home/CitizenReportLocationStep/containers/Content.js`**
9. **`src/screens/Home/IssueActions/containers/Content.js`**
10. **`src/screens/Home/IssueDetail/containers/Content.js`**
11. **`src/screens/Home/IssueHistory/containers/Content.js`**
12. **`src/components/ActionDialog.js`**

### TextInput Prop Updates
Updated TextInput components to use proper placeholder props:

13. **`src/screens/Auth/Login/Login.js`**
    - Changed `labelColor="#dedede"` → `placeholderTextColor={colors.placeholder}`
    - Changed `placeholderColor="#dedede"` → `placeholderTextColor={colors.placeholder}`

14. **`src/screens/Auth/SignUp/SignUp.js`**
    - Changed `labelColor="#dedede"` → `placeholderTextColor={colors.placeholder}` (2 instances)

15. **`src/screens/Home/SearchBarGrm/components/SearchBar.js`**
    - Added `placeholderTextColor={colors.placeholder}` to native TextInput

### Outline Color Updates
Updated hardcoded outline colors for better consistency:

16. **`src/screens/Home/CitizenReportContactInfo/containers/Content.js`**
17. **`src/screens/Home/CitizenReportStep2/containers/Content.js`**
18. **`src/screens/Home/CitizenReportLocationStep/containers/Content.js`**
    - Changed `outlineColor="#dedede"` → `outlineColor={colors.lightgray}`

## Color Hierarchy

### Before
- **Text color**: `#707070` (dark gray)
- **Placeholder color**: `#dedede` (very light gray, barely visible)
- **Border color**: `#dedede` (same as placeholder, confusing)

### After
- **Text color**: `#707070` (dark gray) - unchanged
- **Placeholder color**: `#b0b0b0` (medium gray, clearly visible but distinct)
- **Border color**: `#dedede` (light gray, distinct from placeholder)

## Benefits

1. **Better UX**: Clear distinction between placeholder and entered text
2. **Accessibility**: Improved contrast for placeholder text
3. **Consistency**: Unified placeholder styling across all components
4. **Maintainability**: Centralized color management through theme system

## Testing

To verify the fixes:

1. **Login/SignUp screens**: Check email and password field placeholders
2. **Citizen Report forms**: Check all text inputs and dropdowns
3. **Search functionality**: Verify search bar placeholder
4. **Contact info forms**: Check name and contact detail inputs
5. **Location inputs**: Check location description textarea

All placeholders should now appear in a medium gray (`#b0b0b0`) that's clearly distinguishable from both the text color and background.

## Future Improvements

- Consider using the `createInputTheme()` helper function for new components
- Ensure all custom dropdowns follow the same placeholder color standards
- Test with different accessibility settings and color blindness simulators 
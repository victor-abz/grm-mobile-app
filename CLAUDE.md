# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development
- `expo start` - Start the development server
- `expo run:android` - Run on Android device/emulator
- `expo run:ios` - Run on iOS device/simulator
- `expo start --web` - Start web development server

### Building
- `eas build -p android --profile preview` - Build Android APK for preview
- `eas build:run -p android --latest` - Build and run latest Android build
- `eas build -p android --profile production` - Build for production

### Package Management
- Use `yarn` for package installation (not npm)
- `yarn install` - Install dependencies

## Project Architecture

This is a React Native mobile application built with Expo SDK 51 for a Grievance Redress Mechanism (GRM) system. The app allows citizens to report issues and government officials to manage them.

### Key Technologies
- **React Native + Expo** - Mobile framework
- **WatermelonDB** - Local SQLite database with reactive queries
- **Frappe JS SDK** - Backend integration with Frappe/ERPNext
- **React Navigation** - Navigation management
- **Redux** - State management for auth and some global state
- **React Hook Form** - Form handling
- **i18next** - Internationalization (English, French, Kinyarwanda)

### Database Architecture
The app uses a dual-database approach:
1. **Local WatermelonDB** (`src/database/`) - Offline-first local SQLite database
   - Reactive queries for real-time UI updates
   - Models in `src/database/models/` with decorators
   - Schema defined in `src/database/schema.js`
   - Main manager: `watermelonManager.js`

2. **Remote Frappe Backend** - Server-side database via HTTP API
   - Base URL configured in `src/utils/constants.js` (FRAPPE_BASE_URL)
   - Legacy API in `src/services/API.js` for auth
   - Modern integration via `FrappeProvider.js`

### Data Flow Pattern
The app follows this data flow:
1. **Frappe Backend** sends data with `name` as primary identifier
2. **WatermelonDB** stores data with Frappe `name` as the record `id`
3. **withObservables HOC** provides reactive WatermelonDB model objects to components
4. **Components** process models into display format preserving Frappe structure
5. **Form Submission** passes data with Frappe `name` identifiers

### Key Directories
- `src/screens/` - Screen components organized by feature areas
- `src/components/` - Reusable UI components
- `src/providers/` - React Context providers (Auth, Data, Frappe)
- `src/services/` - Business logic and data managers
- `src/utils/` - Utility functions and constants
- `src/hooks/` - Custom React hooks
- `src/database/` - WatermelonDB setup, models, and schema

### Component Structure
Screens follow a consistent pattern:
```
ScreenName/
├── ScreenName.js           # Main screen component
├── ScreenName.styles.js    # Styles
├── containers/
│   ├── Content.js          # Main content logic
│   └── Content.styles.js   # Content styles
└── components/             # Screen-specific components
```

### Navigation
Two main navigation stacks:
- **Public Routes** (`publicRoutes.js`) - Auth screens
- **Private Routes** (`privateRoutes.js`) - App screens
- Bottom tab navigation for main app sections

## Development Guidelines

### Working with Lookup Data
Follow the pattern in `docs/using-lookup.md`:
1. Use `withObservables` HOC for reactive data from WatermelonDB
2. Access model properties via getters (e.g., `ageGroup.ageGroup`, not `ageGroup.age_group`)
3. Preserve Frappe data structure with `name` as primary identifier
4. Avoid complex data transformations - work with native Frappe structure

### Database Operations
- Use `watermelonManager` singleton for all WatermelonDB operations
- Database models use decorators: `@field()`, `@date()`, `@relation()`
- Always use `await db.write()` for write operations
- Use reactive queries with `.observe()` for UI components

### Styling
- Styles are co-located with components in `.style.js` files
- Global styles in `src/utils/globalStyles.js`
- Colors defined in `src/utils/colors.js`
- Use StyleSheet.create() for performance

### State Management
- Redux for authentication state (`src/store/ducks/`)
- React Context for data providers
- Local component state for UI state
- WatermelonDB reactive queries for database state

### Internationalization
- Translation files in `src/translations/`
- Use `useTranslation()` hook from react-i18next
- Support for English, French, and Kinyarwanda

### Forms
- Use React Hook Form for form management
- Custom dropdown component: `CustomDropDownPicker`
- Form validation utilities in `src/utils/formUtils.js`

## Configuration

### Environment Setup
- Backend URLs configured in `src/utils/constants.js`
- EAS build configuration in `eas.json`
- Expo configuration in `app.json`

### Database Configuration
- WatermelonDB schema in `src/database/schema.js`
- Migrations in `src/database/migrations.js`
- JSI disabled in Expo plugin configuration

### Build Profiles
- **development** - Development builds with dev client
- **preview** - Internal testing builds
- **production** - Production releases

## Issue Resolution Patterns

### WatermelonDB Model Access
When working with WatermelonDB models, always access properties via model getters:
```js
// Wrong
const name = model._raw.category_name;

// Correct  
const name = model.categoryName;
```

### Frappe Data Integration
- Always use `name` field as primary identifier (stored as WatermelonDB `id`)
- Preserve server data structure in local database
- Use `watermelonManager.bulkUpsertLookupData()` for server data sync

### Navigation with Complex Objects
Avoid passing WatermelonDB model objects through navigation to prevent circular reference warnings. Extract only needed data:
```js
navigation.navigate('NextScreen', {
  selectedItem: {
    name: item.name,
    label: item.displayName,
    // Don't pass _model reference
  }
});
```
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

## Agentic QE v3

This project uses **Agentic QE v3** - a Domain-Driven Quality Engineering platform with 13 bounded contexts, ReasoningBank learning, HNSW vector search, and Agent Teams coordination (ADR-064).

---

### CRITICAL POLICIES

#### Integrity Rule (ABSOLUTE)
- NO shortcuts, fake data, or false claims
- ALWAYS implement properly, verify before claiming success
- ALWAYS use real database queries for integration tests
- ALWAYS run actual tests, not assume they pass

**We value the quality we deliver to our users.**

#### Test Execution
- NEVER run `npm test` without `--run` flag (watch mode risk)
- Use: `npm test -- --run`, `npm run test:unit`, `npm run test:integration` when available

#### Data Protection
- NEVER run `rm -f` on `.agentic-qe/` or `*.db` files without confirmation
- ALWAYS backup before database operations

#### Git Operations
- NEVER auto-commit/push without explicit user request
- ALWAYS wait for user confirmation before git operations

---

### Quick Reference

```bash
# Run tests
npm test -- --run

# Check quality
aqe quality assess

# Generate tests
aqe test generate <file>

# Coverage analysis
aqe coverage <path>
```

### Using AQE MCP Tools

AQE exposes tools via MCP with the `mcp__agentic-qe__` prefix. You MUST call `fleet_init` before any other tool.

#### 1. Initialize the Fleet (required first step)

```typescript
mcp__agentic-qe__fleet_init({
  topology: "hierarchical",
  maxAgents: 15,
  memoryBackend: "hybrid"
})
```

#### 2. Generate Tests

```typescript
mcp__agentic-qe__test_generate_enhanced({
  targetPath: "src/services/auth.ts",
  framework: "vitest",
  strategy: "boundary-value"
})
```

#### 3. Analyze Coverage

```typescript
mcp__agentic-qe__coverage_analyze_sublinear({
  paths: ["src/"],
  threshold: 80
})
```

#### 4. Assess Quality

```typescript
mcp__agentic-qe__quality_assess({
  scope: "full",
  includeMetrics: true
})
```

#### 5. Store and Query Patterns (with learning persistence)

```typescript
// Store a learned pattern
mcp__agentic-qe__memory_store({
  key: "patterns/coverage-gap/{timestamp}",
  namespace: "learning",
  value: {
    pattern: "...",
    confidence: 0.95,
    type: "coverage-gap",
    metadata: { /* domain-specific */ }
  },
  persist: true
})

// Query stored patterns
mcp__agentic-qe__memory_query({
  pattern: "patterns/*",
  namespace: "learning",
  limit: 10
})
```

#### 6. Orchestrate Multi-Agent Tasks

```typescript
mcp__agentic-qe__task_orchestrate({
  task: "Full quality assessment of auth module",
  domains: ["test-generation", "coverage-analysis", "security-compliance"],
  parallel: true
})
```

### MCP Tool Reference

| Tool | Description |
|------|-------------|
| `fleet_init` | Initialize QE fleet (MUST call first) |
| `fleet_status` | Get fleet health and agent status |
| `agent_spawn` | Spawn specialized QE agent |
| `test_generate_enhanced` | AI-powered test generation |
| `test_execute_parallel` | Parallel test execution with retry |
| `task_orchestrate` | Orchestrate multi-agent QE tasks |
| `coverage_analyze_sublinear` | O(log n) coverage analysis |
| `quality_assess` | Quality gate evaluation |
| `memory_store` | Store patterns with namespace + persist |
| `memory_query` | Query patterns by namespace/pattern |
| `security_scan_comprehensive` | SAST/DAST scanning |

### Configuration

- **Enabled Domains**: test-generation, test-execution, coverage-analysis, quality-assessment, defect-intelligence, requirements-validation (+6 more)
- **Learning**: Enabled (transformer embeddings)
- **Max Concurrent Agents**: 8
- **Background Workers**: pattern-consolidator

### V3 QE Agents

QE agents are in `.claude/agents/v3/`. Use with Task tool:

```javascript
Task({ prompt: "Generate tests", subagent_type: "qe-test-architect", run_in_background: true })
Task({ prompt: "Find coverage gaps", subagent_type: "qe-coverage-specialist", run_in_background: true })
Task({ prompt: "Security audit", subagent_type: "qe-security-scanner", run_in_background: true })
```

### Data Storage

- **Memory Backend**: `.agentic-qe/memory.db` (SQLite)
- **Configuration**: `.agentic-qe/config.yaml`

---
*Generated by AQE v3 init - 2026-05-08T15:17:54.068Z*

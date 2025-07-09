# PRD: Issue Actions Sync Implementation

## 1. Introduction/Overview

The current GRM mobile app allows users to perform various actions on issues (Accept, Reject, Record Steps, Record Resolution, Escalate, Rate, Appeal) which are saved locally in WatermelonDB. However, these actions are not synchronized to the Frappe backend, creating a data inconsistency between the mobile app and server.

This feature implements the capability to sync all Issue Actions from the mobile app to the backend using the existing WatermelonDB sync protocol, ensuring data consistency and enabling proper audit trails on the server side.

**Goal**: Enable bidirectional sync of Issue Actions between the mobile app and Frappe backend while maintaining the existing sync architecture and user experience.

## 2. Goals

1. **Extend Current Sync Protocol**: Add Issue Actions sync to the existing WatermelonDB sync implementation without breaking current functionality
2. **Maintain Data Integrity**: Ensure all Issue Actions (status changes, comments, logs) are properly synced to the backend
3. **Preserve User Experience**: Keep the current immediate local feedback while adding background sync capability
4. **Follow WatermelonDB Best Practices**: Implement sync according to the [WatermelonDB Sync Frontend documentation](https://watermelondb.dev/docs/Sync/Frontend)

## 3. User Stories

### Primary User Stories

**As a GRM user**, I want my issue actions to be automatically synced to the backend so that:
- My actions are visible to other users and administrators
- Data is consistent across all devices and the web interface
- Audit trails are properly maintained for compliance purposes

**As a system administrator**, I want to see all issue actions in the backend so that:
- I can track user activity and issue progress
- I can generate reports on issue resolution times and user performance

### Secondary User Stories

**As a GRM user**, I want my actions to sync even when performed offline so that:
- I can continue working without internet connectivity
- My actions are automatically synced when I reconnect
- No data is lost due to connectivity issues

## 4. Functional Requirements

### 4.1 Sync Protocol Extension

1. **Extend SYNC_TABLES Mapping**: Add `grm_issue_logs` and `grm_issue_comments` to the backend sync tables mapping
2. **Update Push Changes Filter**: Modify the current push changes filter to include Issue Actions updates and child records
3. **Maintain Transaction Integrity**: Ensure Issue Actions and their child records are synced in a single transaction

### 4.2 Issue Actions Sync Priority

1. **Accept/Reject Actions**: Sync status changes and assignment updates
2. **Record Steps**: Sync comment creation and log entries
3. **Record Resolution**: Sync resolution text and completion logs
4. **Escalate**: Sync escalation reason and escalation logs
5. **Rate/Rating**: Sync rating values and rating logs
6. **Appeal**: Sync appeal reasons and appeal logs

### 4.3 Data Handling Requirements

1. **Complete Record Sync**: Mobile app must send complete child record data (logs/comments) to backend
2. **Transaction-based Sync**: Issue updates and child records must be synced in one transaction
3. **Timestamp Preservation**: Maintain action timestamps for proper audit trail
4. **User Attribution**: Preserve user attribution for all actions

### 4.4 Sync Behavior Requirements

1. **Immediate Sync (Online)**: Actions should sync immediately when performed online
2. **Manual Sync**: As per watermelon it keeps changes, we should leverage this to sync the actions

### 4.5 Field & Column Mapping (Issue-Action → DB updates)

| Action | Primary Table / Columns Updated | Child Table(s) Created | Timestamp Column(s) | Notes (Context-7 best-practice) |
|--------|---------------------------------|------------------------|---------------------|---------------------------------|
| Accept | `grm_issues.status` → new *open* status<br>`grm_issues.assignee` → current user | `grm_issue_logs` (accepted)<br>`grm_issue_comments` (auto message) | `accepted_date`, `modified`, `updated_at` | Always set **all** three timestamps with the same `Date.now()` value (ms) to keep sync deterministic |
| Reject | `grm_issues.status` → *rejected* status<br>`grm_issues.reject_reason`<br>`grm_issues.rejected_by` | `grm_issue_logs` (rejected)<br>`grm_issue_comments` (reason) | `rejected_date`, `modified`, `updated_at` | |
| Record Steps | — (no status change) | `grm_issue_logs` (steps)<br>`grm_issue_comments` (steps text) | `modified`, `updated_at` | |
| Record Resolution | `grm_issues.status` → *final* status<br>`grm_issues.resolution_text`<br>`grm_issues.resolved_by` | `grm_issue_logs` (resolved) | `resolution_date`, `modified`, `updated_at` | |
| Escalate | `grm_issues.escalate_flag` = `true`<br>`grm_issues.escalation_reason`<br>`grm_issues.escalated_by` | `grm_issue_logs` (escalated) | `escalated_date`, `modified`, `updated_at` | |
| Rate | `grm_issues.rating` | `grm_issue_logs` (rated) | `rated_date`, `modified`, `updated_at` | |
| Appeal | `grm_issues.status` → *open* status<br>`grm_issues.appeal_submitted` = `true`<br>`grm_issues.appeal_reason` | `grm_issue_logs` (appeal) | `appeal_date`, `modified`, `updated_at` | |

**Implementation detail**: in App WatermelonDB this is already implemented only find a way to sync it.

## 5. Non-Goals (Out of Scope)

1. **Real-time Sync**: No real-time push notifications or immediate backend updates
2. **Advanced Conflict Resolution**: No custom conflict resolution beyond WatermelonDB's default behavior
3. **UI Changes**: No changes to the existing user interface or action dialogs
4. **Permission Validation**: No additional permission checks beyond existing app logic
5. **Error Recovery**: No custom error handling or rollback mechanisms beyond WatermelonDB defaults
6. **Performance Optimization**: No specific performance optimizations beyond standard sync practices
7. **Audit Trail Enhancement**: No additional audit trail features beyond existing backend capabilities

## 6. Technical Considerations

### 6.1 Backend Integration

1. **Extend Current Sync Endpoints**: Modify existing  `push_changes` endpoints to handle Issue Actions
2. **Add Child Table Support**: Include `grm_issue_logs` and `grm_issue_comments` in sync table mappings
3. **Preserve Existing Logic**: Keep all existing sync functionality intact

### 6.2 Frontend Integration

1. **Extend WatermelonSyncManager**: Add Issue Actions sync to existing `WatermelonSyncManager.js`
2. **Maintain Current Architecture**: No changes to existing `useIssueActions` hook or action execution flow
3. **Leverage Existing Models**: Use existing `grm_issue_logs` and `grm_issue_comments` models
4. **Follow WatermelonDB Protocol**: Implement according to [WatermelonDB Sync Frontend documentation](https://watermelondb.dev/docs/Sync/Frontend)

### 6.3 Data Model Considerations

1. **Schema Alignment**: Ensure mobile app schema matches backend schema for Issue Actions
2. **Timestamp Handling**: Proper conversion between WatermelonDB and Frappe timestamp formats
3. **Field Mapping**: Ensure all action-specific fields matches between frontend and backend as it is currently

### 6.4 Backend Field-Update Logic

The backend currently **ignores** any `updated` array for `grm_issues` and only processes `created`.  
To support Issue-Action sync we must:

1. **Accept new payload shape**

```jsonc
{
  "changes": {
    "grm_issues": {
      "created": [],               // still used for new issues
      "updated": [                 // ← NEW  – records modified by an action
        {
          "id": "ISS-00001",
          "status": "OPEN-002",
          "assignee": "user@example.com",
          "reject_reason": "Citizen withdrew",
          "escalation_reason": null,
          "resolution_text": null,
          "accepted_date": 1720343895000,
          "rejected_date": null,
          "escalated_date": null,
          "resolution_date": null,
          "rated_date": null,
          "appeal_date": null,
          "modified": 1720343895000,
          "updated_at": 1720343895000
        }
      ],
      "deleted": []
    },
    "grm_issue_logs":   { "created": [ … ], "updated": [], "deleted": [] },
    "grm_issue_comments": { "created": [ … ], "updated": [], "deleted": [] }
  },
  "lastPulledAt": 1720343800000
}
```

2. **Processing rules inside `push_changes()`**

## 7. Success Metrics

### 7.1 Functional Success Criteria

1. **Complete Action Sync**: All Issue Actions (Accept, Reject, Record Steps, Record Resolution, Escalate, Rate, Appeal) sync successfully to backend
2. **Child Record Sync**: All associated logs and comments sync with their parent issues
3. **No Data Loss**: All action data is preserved during sync process
4. **Backward Compatibility**: Existing sync functionality continues to work without issues

### 7.2 Technical Success Criteria

1. **Error Handling**: Sync failures are handled gracefully without data corruption
2. **Memory Usage**: Sync process doesn't cause excessive memory usage
3. **Battery Impact**: Sync doesn't significantly impact device battery life

## 8. Implementation Approach

### 8.1 Phase 1: Backend Preparation
1. Extend `SYNC_TABLES` mapping to include `grm_issue_logs` and `grm_issue_comments`
2. Update `push_changes` filter to accept Issue Actions updates
3. Add child table processing to `process_table_changes` function

### 8.2 Phase 2: Frontend Integration
1. Update `WatermelonSyncManager.js` to handle Issue Actions sync
2. Ensure existing action execution flow triggers sync appropriately

## 9. Files Impacted (Full Paths)

| Layer | File Path |
|-------|-----------|
| Backend – sync logic | `/Users/victor/egrm/apps/egrm/egrm/api/sync.py` |
| Backend – DocTypes (ensure fields exist) | `/Users/victor/egrm/apps/egrm/egrm/egrm/doctype/grm_issue/grm_issue.json`<br>`/Users/victor/egrm/apps/egrm/egrm/egrm/doctype/grm_issue_log/grm_issue_log.json`<br>`/Users/victor/egrm/apps/egrm/egrm/egrm/doctype/grm_issue_comment/grm_issue_comment.json` |
| Frontend – sync manager | `src/services/WatermelonSyncManager.js` |
| Frontend – issue actions hook | `src/hooks/useIssueActions.js` |
| Frontend – Watermelon models (confirm columns) | `src/database/models/grm_issue.js`<br>`src/database/models/grm_issue_log.js`<br>`src/database/models/grm_issue_comment.js` |
| Frontend – schema (ensure columns) | `src/database/schema.js` |

> Any additional helper utilities touched during implementation must be added to this list during development.

## 10. Dependencies

1. **WatermelonDB Sync Protocol**: Must follow [WatermelonDB Sync Frontend documentation](https://watermelondb.dev/docs/Sync/Frontend)
2. **Existing Sync Infrastructure**: Must integrate with current `WatermelonSyncManager.js`
3. **Backend Sync Endpoints**: Must extend existing `pull_changes` and `push_changes` endpoints
4. **User Context**: Must respect existing user permission and region filtering

---

**Document Version**: 1.1  
**Created**: 2025-07-07  
**Status**: Ready for Implementation 
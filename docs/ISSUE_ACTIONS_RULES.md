# Issue Actions - Modern Rules and Implementation

## Overview

This document outlines the modernized approach for handling issue action buttons in the GRM mobile application, including the rules for button enablement, status transitions, and comment/log management.

## Action Button Rules

### 1. Accept Button (`_isAcceptEnabled`)

**Purpose**: Allow assigned users to accept newly submitted issues  
**Rule**: Shows when issue is in `initial_status` AND assigned to current user

```javascript
return statusData.initial_status === true && 
       isIssueAssignedToMe && 
       currentStatusId === statusData.id;
```

**Status Transition**: `initial_status` → `open_status`  
**User Requirements**: Must be assigned to the issue  
**Comments**: Automatically adds "Issue was accepted by [user]" comment

### 2. Record Resolution Buttons (`_isRecordResolutionEnabled`)

**Purpose**: Allow assigned users to record steps taken and resolution details  
**Rule**: Shows when issue is in `open_status` AND assigned to current user AND not escalated

```javascript
return statusData.open_status === true && 
       isIssueAssignedToMe && 
       !enrichedIssue?.escalate_flag &&
       currentStatusId === statusData.id;
```

**Status Transition**: 
- Record Steps: No status change (adds action log)
- Record Resolution: `open_status` → `final_status`

**User Requirements**: Must be assigned to the issue  
**Comments**: Adds specific comments for steps taken or resolution details

### 3. Rate/Appeal Button (`_isRateAppealEnabled`)

**Purpose**: Allow citizens to rate completed issues or submit appeals  
**Rule**: Shows when issue is in `final_status` AND NOT assigned to current user

```javascript
return statusData.final_status === true && 
       !isIssueAssignedToMe && 
       currentStatusId === statusData.id;
```

**Status Transition**: 
- Rate: No status change (adds rating)
- Appeal: `final_status` → `open_status`

**User Requirements**: Must NOT be assigned (citizen perspective)  
**Comments**: Adds rating or appeal submission comments

### 4. Escalate Button (`_isEscalateEnabled`)

**Purpose**: Allow escalation of issues that require higher-level attention  
**Rule**: Shows when record resolution is enabled AND not already escalated AND escalation not disabled

```javascript
return isRecordResolutionEnabled && 
       !enrichedIssue?.escalate_flag && 
       !disableEscalation;
```

**Status Transition**: No immediate status change (sets escalation flag)  
**User Requirements**: Must be assigned to the issue  
**Comments**: Adds escalation reason and sets escalation flag

## Status Types in Database

Based on the database schema (`grm_issue_statuses`), each status has the following boolean flags:

- `initial_status`: Newly submitted issues (e.g., "Open")
- `open_status`: Issues being actively worked on (e.g., "In Progress")
- `final_status`: Completed issues (e.g., "Resolved", "Closed")
- `rejected_status`: Rejected issues (e.g., "Rejected")

## Modern Implementation Features

### 1. Offline-First WatermelonDB Integration

The modernized implementation uses WatermelonDB as the primary data store with automatic Frappe sync:

```javascript
// Update issue record in WatermelonDB
await db.write(async () => {
  const issueRecord = await db.get('grm_issues').find(issueId);
  await issueRecord.update((issue) => {
    issue._setRaw('status_id', newStatus.id);
    issue._setRaw('assignee_id', currentUserId);
    issue.updatedAt = new Date();
  });

  // Create comment record
  await db.get('grm_issue_comments').create((comment) => {
    comment._setRaw('grm_issue_id', issueId);
    comment._setRaw('user_id', currentUserId);
    comment.comment = commentText;
    comment.createdAt = new Date();
  });

  // Create log entry
  await db.get('grm_issue_logs').create((log) => {
    log._setRaw('grm_issue_id', issueId);
    log.text = `${actionType.toUpperCase()}: ${commentText}`;
    log.timestamp = new Date();
  });
});
```

**Benefits of Offline-First Approach:**
- Works completely offline
- Automatic sync to Frappe when connection is available
- Consistent data state management
- Built-in conflict resolution
- Better performance and user experience

### 2. Standardized Comment/Log Handling

Each action type has standardized comment templates:

```javascript
const commentMap = {
  accept: t('issue_was_accepted_by_user', { user: currentUserId }),
  reject: t('issue_was_rejected_by_user', { user: currentUserId, reason: reason }),
  record_resolution: t('issue_was_resolved_by_user', { user: currentUserId }),
  escalate: t('issue_was_escalated_by_user', { user: currentUserId, reason: escalateComment }),
  record_steps: t('steps_recorded_by_user', { user: currentUserId, steps: comment }),
  rate: t('issue_was_rated_by_citizen', { rating: rating }),
  appeal: t('appeal_submitted_by_citizen'),
};
```

### 3. Input Validation

All actions now include proper validation:

- **Accept**: Requires valid open status in database
- **Reject**: Requires rejection reason text
- **Record Steps**: Requires steps description text
- **Record Resolution**: Requires resolution details text
- **Escalate**: Requires escalation reason text
- **Rate**: Requires rating selection (1-5)

### 4. Error Handling

Comprehensive error handling with specific error messages:

```javascript
const errorMessages = {
  accept: t('error_accepting_issue'),
  reject: t('error_rejecting_issue'),
  record_resolution: t('error_recording_resolution'),
  escalate: t('error_escalating_issue'),
  record_steps: t('error_recording_steps'),
  rate: t('error_submitting_rating'),
  appeal: t('error_submitting_appeal'),
};
```

## Assignment Logic

The `_isIssueAssignedToMe` function determines if the current user can perform assigned-user actions:

```javascript
const result = enrichedIssue.reporter.id === enrichedIssue.assignee.id ||
               enrichedIssue.assignee.id === currentUserId;
```

**Rules**:
1. User is explicitly assigned to the issue, OR
2. User is both the reporter and assignee (self-assignment)

## UI State Management

The modernized implementation properly manages UI state for each action:

- Shows/hides appropriate dialogs
- Updates button enablement states
- Refreshes action buttons after status changes
- Provides user feedback through toast messages

## Database Updates

Each action updates relevant fields in the GRM Issue DocType:

### Accept Action
- `assignee`: Current user ID
- `accepted_date`: Current timestamp
- `status`: New open status

### Reject Action
- `reject_reason`: User-provided reason
- `rejected_date`: Current timestamp
- `rejected_by`: Current user ID
- `status`: Rejected status

### Record Resolution Action
- `resolution_text`: User-provided resolution
- `resolution_date`: Current timestamp
- `resolved_by`: Current user ID
- `status`: Final status

### Escalate Action
- `escalate_flag`: true
- `escalated_date`: Current timestamp
- `escalated_by`: Current user ID
- `escalation_reason`: User-provided reason

### Record Steps Action
- `action_taken`: User-provided steps
- `action_taken_date`: Current timestamp
- `action_taken_by`: Current user ID

### Rate Action
- `rating`: User-selected rating (1-5)
- `rated_date`: Current timestamp

### Appeal Action
- `appeal_submitted`: true
- `appeal_date`: Current timestamp
- `status`: Open status (reopens the issue)

## Database Field Mappings

### GRM Issue Fields (Backend → WatermelonDB → Model)

**Core Fields:**
- `status` → `status_id` → `issue.status`
- `assignee` → `assignee_id` → `issue.assignee`
- `reporter` → `reporter_id` → `issue.reporter`

**Action Tracking Fields (Newly Added):**
- `accepted_date` → `accepted_date` → `issue.acceptedDate`
- `reject_reason` → `reject_reason` → `issue.rejectReason` 
- `rejected_date` → `rejected_date` → `issue.rejectedDate`
- `rejected_by` → `rejected_by` → `issue.rejectedBy`
- `escalated_date` → `escalated_date` → `issue.escalatedDate`
- `escalated_by` → `escalated_by` → `issue.escalatedBy`
- `escalation_reason` → `escalation_reason` → `issue.escalationReason`
- `resolution_text` → `resolution_text` → `issue.resolutionText`
- `resolved_by` → `resolved_by` → `issue.resolvedBy`
- `rated_date` → `rated_date` → `issue.ratedDate`
- `appeal_submitted` → `appeal_submitted` → `issue.appealSubmitted`
- `appeal_date` → `appeal_date` → `issue.appealDate`

### GRM Issue Log Fields

**Existing Fields:**
- `text` → `text` → `logRecord.text`
- `user` → `user_id` → `logRecord.user`
- `timestamp` → `timestamp` → `logRecord.timestamp`

**Action Tracking Fields (Newly Added):**
- `action_taken` → `action_taken` → `logRecord.actionTaken`
- `action_taken_date` → `action_taken_date` → `logRecord.actionTakenDate`
- `action_taken_by` → `action_taken_by` → `logRecord.actionTakenBy`

## Proper WatermelonDB Usage

### Field Updates

```javascript
// ✅ CORRECT - Direct field assignment
issue.rejectReason = reason;
issue.rejectedDate = new Date();
issue.rating = 5;

// ✅ CORRECT - Relation field updates
issue.assignee.set(currentUserId);
issue.status.set(newStatusId);

// ❌ INCORRECT - Raw field setters (causes type errors)
issue._setRaw('reject_reason', reason);
issue._setRaw('rejected_date', now.getTime());
```

### Record Creation

```javascript
// ✅ CORRECT - Proper record creation
await db.get('grm_issue_comments').create((commentRecord) => {
  commentRecord.issue.set(enrichedIssue.id);
  commentRecord.user.set(currentUserId);
  commentRecord.comment = commentText;
  commentRecord.createdAt = new Date();
});

// ❌ INCORRECT - Raw field setters in creation
commentRecord._setRaw('grm_issue_id', enrichedIssue.id);
commentRecord._setRaw('user_id', currentUserId);
```

## Benefits of Modern Approach

1. **Offline-First Architecture**: Complete functionality without internet connection, with automatic sync when available
2. **Consistency**: Standardized rules and data handling across all actions using WatermelonDB
3. **Performance**: Fast local database operations with reactive UI updates
4. **Traceability**: Proper audit logs and comments stored locally and synced to backend
5. **Reliability**: Built-in conflict resolution and data integrity through WatermelonDB
6. **Validation**: Input validation prevents invalid state transitions
7. **User Experience**: Instant feedback and seamless offline/online experience
8. **Maintainability**: Well-documented rules and clean separation of concerns
9. **Internationalization**: Proper translation key usage for all messages
10. **Scalability**: Efficient batch operations and reactive queries

## Future Enhancements

1. **Role-based Permissions**: Integrate with Frappe user roles for fine-grained access control
2. **Workflow Integration**: Use Frappe workflows for complex approval processes
3. **Notification System**: Send notifications on status changes
4. **Bulk Actions**: Support for bulk status updates
5. **Advanced Escalation**: Time-based auto-escalation rules
6. **Analytics**: Track action performance and user behavior 
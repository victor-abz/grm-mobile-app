# Issue Actions - Modern Rules and Implementation

## Overview

This document outlines the modernized approach for handling issue action buttons in the GRM mobile application, including the rules for button enablement, status transitions, and comment/log management.

## Action Button Rules

### 1. Accept Button (`_isAcceptEnabled`)

**Purpose**: Allow assigned users to accept newly submitted issues or issues with unknown status  
**Rules**: 
1. Issue is in `initial_status` AND assigned to current user AND current status matches the status being checked
2. Issue has "Unknown" status (empty `status_id`) AND assigned to current user

```javascript
// Check for initial status match
const isInitialStatusMatch = (
  statusData.initial_status === true &&
  isIssueAssignedToMe &&
  currentStatusId === statusData.id
);

// Check for unknown status and assignment
const isUnknownStatusAndAssigned = () => {
  const currentStatusId = enrichedIssue?.status_id || enrichedIssue?.status?.id;
  const isUnknownStatus = !currentStatusId || currentStatusId === '';
  return isUnknownStatus && isIssueAssignedToMe;
};

// Enable accept button if either condition is met
const acceptEnabled = statuses.some(_isAcceptEnabled) || isUnknownStatusAndAssigned();
```

**Status Transition**: 
- `initial_status` → `open_status` (In Progress)
- `Unknown status` → `open_status` (In Progress)

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

**Special Case - Unknown Status:**
- Issues with empty `status_id` field show as "Unknown" status
- These can be accepted/rejected by assigned users (common after data migration or sync issues)

## Modern Implementation Features

### 1. Offline-First WatermelonDB Integration

The modernized implementation uses WatermelonDB as the primary data store with automatic Frappe sync:

```javascript
// ✅ CORRECT - Working implementation using _setRaw for relation fields
await db.write(async () => {
  const issueRecord = await db.get('grm_issues').find(issueId);
  await issueRecord.update((issue) => {
    // Use _setRaw for foreign key fields (relation fields)
    issue._setRaw('status_id', newStatus.id);
    issue._setRaw('assignee_id', currentUserId);
    issue._setRaw('rejected_by', currentUserId);
    
    // Use direct assignment for regular fields
    issue.rejectReason = reason;
    issue.rejectedDate = new Date();
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
    log._setRaw('user_id', currentUserId);
    log.actionTaken = actionType;
    log.text = logText;
    log.timestamp = new Date();
  });

  // ✅ VALIDATION - Verify the update worked
  const updatedIssue = await db.get('grm_issues').find(issueId);
  if (updatedIssue._raw.status_id !== expectedStatusId) {
    throw new Error(`Status update failed: expected ${expectedStatusId}, got ${updatedIssue._raw.status_id}`);
  }
});
```

**Critical Finding - WatermelonDB Field Assignment:**
- **Foreign Key Fields**: Use `_setRaw('field_name', value)` for relation fields (status_id, assignee_id, etc.)
- **Regular Fields**: Use direct assignment (`issue.fieldName = value`)
- **Relation Setters**: `issue.relation.set(id)` does NOT work reliably for our use case

**Benefits of Offline-First Approach:**
- Works completely offline
- Automatic sync to Frappe when connection is available
- Consistent data state management
- Built-in conflict resolution
- Better performance and user experience

### 2. Modernized Comment and Log Structure

The system now uses a clean, standardized approach for comments and logs:

#### Comment Creation Logic

```javascript
// For record_steps action - use actual user input
if (actionType === 'record_steps') {
  commentText = comment; // Use the actual steps text entered by user
} else {
  // For other actions - use templated messages
  const commentMap = {
    accept: t('issue_was_accepted_by_user', { user: currentUserId }),
    reject: t('issue_was_rejected_by_user', { user: currentUserId, reason: reason }),
    record_resolution: t('issue_was_resolved_by_user', { user: currentUserId }),
    escalate: t('issue_was_escalated_by_user', { user: currentUserId, reason: escalateComment }),
    rate: t('issue_was_rated_by_citizen', { rating: rating }),
    appeal: t('appeal_submitted_by_citizen'),
  };
  commentText = commentMap[actionType] || t('status_updated');
}
```

#### Log Structure Enhancement

```javascript
// Log entry creation with proper actionTaken and text fields
switch (actionType) {
  case 'accept':
    logRecord.actionTaken = t('accepted_issue') || 'Accepted issue';
    logRecord.text = t('issue_accepted_explanation') || 'Issue has been accepted and assigned for processing';
    break;

  case 'record_steps':
    logRecord.actionTaken = t('added_steps') || 'Added steps';
    logRecord.text = comment; // Use actual user input as text
    logRecord.actionTakenDate = new Date();
    logRecord._setRaw('action_taken_by', currentUserId);
    break;

  case 'record_resolution':
    logRecord.actionTaken = t('resolved_issue') || 'Resolved issue';
    logRecord.text = t('issue_resolved_explanation') || 'Issue has been marked as resolved';
    break;

  // ... other action types
}
```

### 3. Simplified Comment Processing in IssueHistory

The IssueHistory component now uses a clean, single-path logic for processing comments:

```javascript
// Determine activity type based on comment content
let activityType = 'General Activity';
let displayText = rawComment.comment;
let fullText = rawComment.comment;

// Check for templated messages (system actions)
if (rawComment.comment.includes('issue_was_accepted_by_user')) {
  activityType = t('accept_issue') || 'Issue Accepted';
  displayText = `${activityType} by ${userName}`;
  fullText = t('issue_accepted_explanation') || 'Issue has been accepted and assigned for processing';
} else if (rawComment.comment.includes('issue_was_rejected_by_user')) {
  activityType = t('reject_issue') || 'Issue Rejected';
  displayText = `${activityType} by ${userName}`;
  fullText = t('issue_rejected_explanation') || 'Issue has been rejected with provided reason';
} else if (rawComment.comment.includes('issue_was_resolved_by_user')) {
  activityType = t('record_resolution') || 'Issue Resolved';
  displayText = `${activityType} by ${userName}`;
  fullText = t('issue_resolved_explanation') || 'Issue has been marked as resolved';
} else if (rawComment.comment.includes('issue_was_escalated_by_user')) {
  activityType = t('escalate') || 'Issue Escalated';
  displayText = `${activityType} by ${userName}`;
  fullText = t('issue_escalated_explanation') || 'Issue has been escalated for higher-level attention';
} else if (rawComment.comment.includes('issue_was_rated_by_citizen')) {
  activityType = t('rate_issue') || 'Issue Rated';
  displayText = `${activityType}`;
  fullText = t('issue_rated_explanation') || 'Citizen has provided feedback rating';
} else if (rawComment.comment.includes('appeal_submitted_by_citizen')) {
  activityType = t('appeal_issue') || 'Appeal Submitted';
  displayText = `${activityType}`;
  fullText = t('appeal_submitted_explanation') || 'Appeal has been submitted for review';
} else {
  // For record_steps, the comment contains actual user input
  activityType = t('record_steps_taken') || 'Steps Recorded';
  displayText = rawComment.comment; // Show the actual steps
  fullText = rawComment.comment; // Full text is the same
}
```

### 4. Input Validation

All actions now include proper validation:

- **Accept**: Requires valid open status in database OR unknown status with assignment
- **Reject**: Requires rejection reason text
- **Record Steps**: Requires steps description text
- **Record Resolution**: Requires resolution details text
- **Escalate**: Requires escalation reason text
- **Rate**: Requires rating selection (1-5)

### 5. Error Handling and Validation

Comprehensive error handling with database validation:

```javascript
try {
  await db.write(async () => {
    // Perform updates...
    
    // ✅ Validate the update actually worked
    if (newStatus) {
      const updatedIssue = await db.get('grm_issues').find(enrichedIssue.id);
      const expectedStatusId = newStatus.id || newStatus._raw?.id;
      
      if (updatedIssue._raw.status_id !== expectedStatusId) {
        throw new Error(`Status update failed: expected ${expectedStatusId}, got ${updatedIssue._raw.status_id}`);
      }
    }
  });
} catch (error) {
  console.error('❌ [IssueActions] Error updating issue status:', error);
  showToast(t('error_updating_issue_status') || 'Error updating issue status. Please try again.');
}
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
- Handles unknown status issues gracefully

## Database Updates

Each action updates relevant fields in the GRM Issue DocType:

### Accept Action
- `assignee_id`: Current user ID (using `_setRaw`)
- `accepted_date`: Current timestamp
- `status_id`: New open status ID (using `_setRaw`)

### Reject Action
- `reject_reason`: User-provided reason
- `rejected_date`: Current timestamp
- `rejected_by`: Current user ID (using `_setRaw`)
- `status_id`: Rejected status ID (using `_setRaw`)

### Record Resolution Action
- `resolution_text`: User-provided resolution
- `resolution_date`: Current timestamp
- `resolved_by`: Current user ID (using `_setRaw`)
- `status_id`: Final status ID (using `_setRaw`)

### Escalate Action
- `escalate_flag`: true
- `escalated_date`: Current timestamp
- `escalated_by`: Current user ID (using `_setRaw`)
- `escalation_reason`: User-provided reason

### Record Steps Action
- `action_taken`: Past tense action description (in log record)
- `action_taken_date`: Current timestamp (in log record)
- `action_taken_by`: Current user ID (in log record, using `_setRaw`)
- `text`: Actual user input text (in log record)

### Rate Action
- `rating`: User-selected rating (1-5)
- `rated_date`: Current timestamp

### Appeal Action
- `appeal_submitted`: true
- `appeal_date`: Current timestamp
- `status_id`: Open status ID (reopens the issue, using `_setRaw`)

## Database Field Mappings

### GRM Issue Fields (Backend → WatermelonDB → Model)

**Core Fields:**
- `status` → `status_id` → `issue.status` (use `_setRaw('status_id', value)`)
- `assignee` → `assignee_id` → `issue.assignee` (use `_setRaw('assignee_id', value)`)
- `reporter` → `reporter_id` → `issue.reporter`

**Action Tracking Fields:**
- `accepted_date` → `accepted_date` → `issue.acceptedDate`
- `reject_reason` → `reject_reason` → `issue.rejectReason` 
- `rejected_date` → `rejected_date` → `issue.rejectedDate`
- `rejected_by` → `rejected_by` → `issue.rejectedBy` (use `_setRaw('rejected_by', value)`)
- `escalated_date` → `escalated_date` → `issue.escalatedDate`
- `escalated_by` → `escalated_by` → `issue.escalatedBy` (use `_setRaw('escalated_by', value)`)
- `escalation_reason` → `escalation_reason` → `issue.escalationReason`
- `resolution_text` → `resolution_text` → `issue.resolutionText`
- `resolved_by` → `resolved_by` → `issue.resolvedBy` (use `_setRaw('resolved_by', value)`)
- `rated_date` → `rated_date` → `issue.ratedDate`
- `appeal_submitted` → `appeal_submitted` → `issue.appealSubmitted`
- `appeal_date` → `appeal_date` → `issue.appealDate`

### GRM Issue Log Fields

**Existing Fields:**
- `text` → `text` → `logRecord.text`
- `user` → `user_id` → `logRecord.user` (use `_setRaw('user_id', value)`)
- `timestamp` → `timestamp` → `logRecord.timestamp`

**Action Tracking Fields:**
- `action_taken` → `action_taken` → `logRecord.actionTaken`
- `action_taken_date` → `action_taken_date` → `logRecord.actionTakenDate`
- `action_taken_by` → `action_taken_by` → `logRecord.actionTakenBy` (use `_setRaw('action_taken_by', value)`)

## Proper WatermelonDB Usage - CRITICAL FINDINGS

### ✅ CORRECT Field Assignment Methods

```javascript
// For Foreign Key/Relation Fields - Use _setRaw
issue._setRaw('status_id', statusId);
issue._setRaw('assignee_id', currentUserId);
issue._setRaw('rejected_by', currentUserId);
issue._setRaw('resolved_by', currentUserId);
issue._setRaw('escalated_by', currentUserId);

// For Regular Fields - Use Direct Assignment
issue.rejectReason = reason;
issue.rejectedDate = new Date();
issue.rating = 5;
issue.escalateFlag = true;

// For Record Creation - Use _setRaw for Relations
await db.get('grm_issue_comments').create((commentRecord) => {
  commentRecord._setRaw('grm_issue_id', enrichedIssue.id);
  commentRecord._setRaw('user_id', currentUserId);
  commentRecord.comment = commentText;
  commentRecord.createdAt = new Date();
});
```

### ❌ INCORRECT Methods (These Don't Work)

```javascript
// ❌ Relation setters don't work reliably
issue.status.set(statusId);           // Fails silently
issue.assignee.set(currentUserId);    // Fails silently
issue.rejectedBy.set(currentUserId);  // Fails silently

// ❌ Direct assignment to relation fields
issue.statusId = statusId;            // Wrong field name
issue.assigneeId = currentUserId;     // Wrong field name

// ❌ Direct _raw manipulation
issue._raw.status_id = statusId;      // Bypasses WatermelonDB
```

### Key Insights from Implementation

1. **Field Names**: Use exact database field names from schema (`status_id`, `assignee_id`, etc.)
2. **_setRaw Method**: Required for foreign key fields during updates and creation
3. **Validation**: Always verify critical updates actually worked
4. **Unknown Status**: Handle empty `status_id` as a valid state that can be acted upon
5. **Error Handling**: Catch and log detailed error information for debugging
6. **Clean Code**: No backward compatibility clutter - single-path logic for each action type

## Translation Keys Used

### Action Types (Past Tense for Log Records)
- `accepted_issue`: "Accepted issue"
- `rejected_issue`: "Rejected issue" 
- `added_steps`: "Added steps"
- `resolved_issue`: "Resolved issue"
- `escalated_issue`: "Escalated issue"
- `rated_issue`: "Rated issue"
- `submitted_appeal`: "Submitted appeal"

### Comment Templates (Present Tense for Comments)
- `issue_was_accepted_by_user`: "Issue was accepted by {user}"
- `issue_was_rejected_by_user`: "Issue was rejected by {user}, reason: {reason}"
- `issue_was_resolved_by_user`: "Issue was resolved by {user}"
- `issue_was_escalated_by_user`: "Issue was escalated by {user}, reason: {reason}"
- `issue_was_rated_by_citizen`: "Issue was rated by citizen, rating: {rating}"
- `appeal_submitted_by_citizen`: "Appeal submitted by citizen"

### Explanation Text (For Activity Details)
- `issue_accepted_explanation`: "Issue has been accepted and assigned for processing"
- `issue_rejected_explanation`: "Issue has been rejected with provided reason"
- `issue_resolved_explanation`: "Issue has been marked as resolved"
- `issue_escalated_explanation`: "Issue has been escalated for higher-level attention"
- `issue_rated_explanation`: "Citizen has provided feedback rating"
- `appeal_submitted_explanation`: "Appeal has been submitted for review"

## Benefits of Modern Approach

1. **Offline-First Architecture**: Complete functionality without internet connection, with automatic sync when available
2. **Consistency**: Standardized rules and data handling across all actions using WatermelonDB
3. **Performance**: Fast local database operations with reactive UI updates
4. **Traceability**: Proper audit logs and comments stored locally and synced to backend
5. **Reliability**: Built-in conflict resolution and data integrity through WatermelonDB
6. **Validation**: Input validation and database update verification prevent invalid states
7. **User Experience**: Instant feedback and seamless offline/online experience
8. **Maintainability**: Clean code without backward compatibility clutter
9. **Internationalization**: Proper translation key usage for all messages
10. **Scalability**: Efficient batch operations and reactive queries
11. **Unknown Status Handling**: Graceful handling of data migration and sync edge cases
12. **Simplified Logic**: Single-path processing for each action type without complex fallbacks

## Troubleshooting Common Issues

### Issue: Status updates don't persist after refresh
**Cause**: Using incorrect field assignment methods  
**Solution**: Use `_setRaw('status_id', value)` for relation fields

### Issue: "Cannot read property 'type' of undefined" errors
**Cause**: Missing backend fields or incorrect WatermelonDB schema  
**Solution**: Ensure all action tracking fields exist in backend and WatermelonDB schema

### Issue: Accept button not enabled for assigned issues
**Cause**: Assignment logic not accounting for unknown status  
**Solution**: Add `isUnknownStatusAndAssigned()` check to accept button logic

### Issue: Database validation errors
**Cause**: Field updates failing silently  
**Solution**: Add validation after updates to verify changes were applied

### Issue: Comments not displaying properly in history
**Cause**: Comments table not being queried separately from issue object  
**Solution**: Use separate database query for comments in IssueHistory component

## Future Enhancements

1. **Role-based Permissions**: Integrate with Frappe user roles for fine-grained access control
2. **Workflow Integration**: Use Frappe workflows for complex approval processes
3. **Notification System**: Send notifications on status changes
4. **Bulk Actions**: Support for bulk status updates
5. **Advanced Escalation**: Time-based auto-escalation rules
6. **Analytics**: Track action performance and user behavior
7. **Data Recovery**: Tools for handling unknown status issues automatically
8. **Enhanced Validation**: Real-time validation and conflict detection 
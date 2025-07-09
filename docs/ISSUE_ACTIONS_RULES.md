# Issue Actions - Latest Implementation Rules and Specifications

## Overview

This document outlines the complete implementation for handling issue action buttons in the GRM mobile application based on the latest codebase. It includes button enablement rules, status transitions, data requirements, and complete implementation specifications.

## Complete Button Implementation

Based on the latest implementation in `Content.js`, `useIssueActions.js`, and `issueButtonUtils.js`, the system implements **7 distinct action buttons** with specific rules and data requirements.

### 1. Accept Issue Button

**Purpose**: Allow assigned users to accept newly submitted issues or issues with unknown status  
**Translation Key**: `accept_issue`  
**Button Component**: `ActionButton` with title from `t('accept_issue')`  

**Enablement Conditions**:
```javascript
// From issueButtonUtils.js - isAcceptEnabled()
export const isAcceptEnabled = (statuses, enrichedIssue, isIssueAssignedToMe) => {
  if (!statuses || !enrichedIssue) return false;

  const currentStatusId = enrichedIssue.status;

  // Check for initial status match
  const hasInitialStatusMatch = statuses.some((status) => {
    const statusData = status._raw || status;
    return (
      statusData.initial_status === true && 
      isIssueAssignedToMe && 
      currentStatusId === statusData.id
    );
  });

  // Check for unknown status and assigned
  const isUnknownStatusAndAssigned = 
    (!currentStatusId || currentStatusId === '') && isIssueAssignedToMe;

  return hasInitialStatusMatch || isUnknownStatusAndAssigned;
};
```

**Show When**:
1. Issue has `initial_status = true` AND user is assigned AND current status matches this status, OR
2. Issue has unknown/empty status AND user is assigned to the issue

**Data Set on Click**:
```javascript
// From useIssueActions.js - saveIssueStatus()
[ACTION_TYPES.ACCEPT]: () => {
  issue._setRaw('assignee', currentUserId);
  issue.acceptedDate = now;
  // Status changes to open_status
}
```

**Database Updates**:
- `assignee`: Current user ID (using `_setRaw`)
- `accepted_date`: Current timestamp
- `status`: Changes to first status with `open_status = true`
- `updated_at`: Current timestamp

**Comments/Logs Created**:
- **Comment**: `t('issue_was_accepted_by_user', { user: currentUserId })`
- **Log Action**: `t('accepted_issue')` or 'Accepted issue'
- **Log Text**: `t('issue_accepted_explanation')` or 'Issue has been accepted and assigned for processing'

**Dialog**: `DIALOG_TYPES.ACCEPT` - Confirmation dialog with success state

---

### 2. Record Steps Taken Button

**Purpose**: Allow assigned users to record steps taken while working on the issue  
**Translation Key**: `record_steps_taken`  
**Button Component**: `ActionButton` with title from `t('record_steps_taken')`  

**Enablement Conditions**:
```javascript
// From issueButtonUtils.js - isRecordResolutionEnabled()
export const isRecordResolutionEnabled = (statuses, enrichedIssue, isIssueAssignedToMe) => {
  if (!statuses || !enrichedIssue || !isIssueAssignedToMe || enrichedIssue.escalate_flag) {
    return false;
  }

  const currentStatusId = enrichedIssue.status;

  return statuses.some((status) => {
    const statusData = status._raw || status;
    return statusData.open_status === true && currentStatusId === statusData.id;
  });
};
```

**Show When**:
1. Issue has `open_status = true` AND current status matches this status
2. User is assigned to the issue
3. Issue has NOT been escalated (`escalate_flag = false`)

**Data Set on Click**:
```javascript
// From useIssueActions.js - No status change for record steps
// Only creates comment and log entries
```

**Database Updates**:
- **No issue field updates** (status remains the same)
- `updated_at`: Current timestamp

**Required Input**: 
- `formInputs.comment`: User-provided steps description (validated as non-empty)

**Comments/Logs Created**:
- **Comment**: Actual user input from `formInputs.comment`
- **Log Action**: `t('added_steps')` or 'Added steps'
- **Log Text**: Actual user input from `formInputs.comment`
- **Log Fields**: `action_taken_date`, `action_taken_by` (using `_setRaw`)

**Dialog**: `DIALOG_TYPES.RECORD_STEPS` - Input dialog with text field for steps

---

### 3. Record Resolution Button

**Purpose**: Allow assigned users to record final resolution and mark issue as resolved  
**Translation Key**: `record_resolution`  
**Button Component**: `ActionButton` with title from `t('record_resolution')`  

**Enablement Conditions**: Same as Record Steps (uses `isRecordResolutionEnabled`)

**Show When**:
1. Issue has `open_status = true` AND current status matches this status
2. User is assigned to the issue  
3. Issue has NOT been escalated (`escalate_flag = false`)

**Data Set on Click**:
```javascript
// From useIssueActions.js - saveIssueStatus()
[ACTION_TYPES.RECORD_RESOLUTION]: () => {
  issue.resolutionText = formInputs.resolution;
  issue.resolutionDate = now;
  issue._setRaw('resolved_by', currentUserId);
  // Status changes to final_status
}
```

**Database Updates**:
- `resolution_text`: User-provided resolution details
- `resolution_date`: Current timestamp
- `resolved_by`: Current user ID (using `_setRaw`)
- `status`: Changes to first status with `final_status = true`
- `updated_at`: Current timestamp

**Required Input**: 
- `formInputs.resolution`: User-provided resolution details (validated as non-empty)

**Comments/Logs Created**:
- **Comment**: User input from `formInputs.resolution`
- **Log Action**: `t('resolved_issue')` or 'Resolved issue'
- **Log Text**: User input from `formInputs.resolution`

**Dialog**: `DIALOG_TYPES.RECORD_RESOLUTION` - Two-step confirmation dialog with resolution input

---

### 4. Rate/Appeal Button

**Purpose**: Allow citizens to rate completed issues or submit appeals  
**Translation Key**: `rate_appeal`  
**Button Component**: `ActionButton` with title from `t('rate_appeal')`  

**Enablement Conditions**:
```javascript
// From issueButtonUtils.js - isRateAppealEnabled()
export const isRateAppealEnabled = (statuses, enrichedIssue, isIssueAssignedToMe) => {
  if (!statuses || !enrichedIssue) {
    return false;
  }

  const currentStatusId = enrichedIssue.status;

  return statuses.some((status) => {
    const statusData = status._raw || status;
    return statusData.final_status === true && currentStatusId === statusData.id;
  });
};
```

**Show When**:
1. Issue has `final_status = true` AND current status matches this status
2. **No user assignment restriction** (available to all users)

**Two-Phase Implementation**:

#### Phase 1: Rating (ACTION_TYPES.RATE)
**Data Set on Click**:
```javascript
[ACTION_TYPES.RATE]: () => {
  if (formInputs.rating > 0) {
    issue.rating = formInputs.rating;
    issue.ratedDate = now;
  }
}
```

**Database Updates**:
- `rating`: User-selected rating (1-5)
- `rated_date`: Current timestamp (only if rating > 0)
- `updated_at`: Current timestamp

**Required Input**: 
- `formInputs.rating`: Star rating selection (1-5, validated as > 0)

#### Phase 2: Appeal (ACTION_TYPES.APPEAL) - Triggered if rating = 0
**Data Set on Click**:
```javascript
[ACTION_TYPES.APPEAL]: () => {
  issue.appealSubmitted = true;
  issue.appealDate = now;
  if (formInputs.reason && formInputs.reason.trim()) {
    issue.appealReason = formInputs.reason;
  }
  if (formInputs.rating > 0) {
    issue.rating = formInputs.rating;
  }
  // Status changes back to open_status
}
```

**Database Updates**:
- `appeal_submitted`: true
- `appeal_date`: Current timestamp
- `appeal_reason`: User-provided reason (optional)
- `rating`: Rating if provided
- `status`: Changes to first status with `open_status = true` (reopens issue)
- `updated_at`: Current timestamp

**Comments/Logs Created**:
- **Rate Comment**: `Rating: ${formInputs.rating}/5` or 'No rating provided'
- **Appeal Comment**: `formInputs.reason` or `t('appeal_submitted_by_citizen')`
- **Rate Log**: Action: `t('rated_issue')`, Text: Rating details
- **Appeal Log**: Action: `t('submitted_appeal')`, Text: Appeal reason or explanation

**Dialog**: `DIALOG_TYPES.RATING` → `DIALOG_TYPES.RATE_APPEAL` (conditional flow)

---

### 5. Escalate Button

**Purpose**: Allow escalation of issues that require higher-level attention  
**Translation Key**: `escalate`  
**Button Component**: `ActionButton` with title from `t('escalate')`  

**Enablement Conditions**:
```javascript
// From issueButtonUtils.js - isEscalateEnabled()
export const isEscalateEnabled = (
  isRecordResolutionEnabled,
  enrichedIssue,
  disableEscalation = false
) => {
  return isRecordResolutionEnabled && 
         !enrichedIssue?.escalate_flag && 
         !disableEscalation;
};
```

**Show When**:
1. Record resolution buttons are enabled (open status + assigned + not escalated)
2. Issue has NOT been escalated yet (`escalate_flag = false`)
3. Escalation is not disabled in state (`disableEscalation = false`)

**Data Set on Click**:
```javascript
[ACTION_TYPES.ESCALATE]: () => {
  issue.escalateFlag = true;
  issue.escalatedDate = now;
  issue._setRaw('escalated_by', currentUserId);
  issue.escalationReason = formInputs.escalateComment;
  // No status change
}
```

**Database Updates**:
- `escalate_flag`: true
- `escalated_date`: Current timestamp
- `escalated_by`: Current user ID (using `_setRaw`)
- `escalation_reason`: User-provided escalation reason
- `updated_at`: Current timestamp
- **No status change**

**Required Input**: 
- `formInputs.escalateComment`: User-provided escalation reason (validated as non-empty)

**Comments/Logs Created**:
- **Comment**: User input from `formInputs.escalateComment`
- **Log Action**: `t('escalated_issue')` or 'Escalated issue'
- **Log Text**: User input from `formInputs.escalateComment`

**Dialog**: `DIALOG_TYPES.ESCALATE` - Input dialog with escalation reason field

**Post-Action Behavior**: 
- Sets `disableEscalation = true` in state
- Disables record resolution buttons
- Shows success dialog then auto-hides

---

### 6. Reject Issue Button (Hidden in UI, Available via Accept Dialog)

**Purpose**: Allow assigned users to reject issues that cannot be processed  
**Translation Key**: `reject_issue`  
**Access**: Secondary action in Accept dialog (`DIALOG_TYPES.ACCEPT`)

**Enablement Conditions**: Same as Accept button (available when Accept is shown)

**Data Set on Click**:
```javascript
[ACTION_TYPES.REJECT]: () => {
  issue.rejectReason = formInputs.reason;
  issue.rejectedDate = now;
  issue._setRaw('rejected_by', currentUserId);
  // Status changes to rejected_status
}
```

**Database Updates**:
- `reject_reason`: User-provided rejection reason
- `rejected_date`: Current timestamp
- `rejected_by`: Current user ID (using `_setRaw`)
- `status`: Changes to first status with `rejected_status = true`
- `updated_at`: Current timestamp

**Required Input**: 
- `formInputs.reason`: User-provided rejection reason (validated as non-empty)

**Comments/Logs Created**:
- **Comment**: User input from `formInputs.reason`
- **Log Action**: `t('rejected_issue')` or 'Rejected issue'
- **Log Text**: User input from `formInputs.reason`

**Dialog**: `DIALOG_TYPES.REJECT` - Input dialog with rejection reason field

---

## Button State Management

### Button States Calculation
```javascript
// From issueButtonUtils.js - calculateButtonStates()
export const calculateButtonStates = (
  statuses,
  enrichedIssue,
  currentUserId,
  disableEscalation = false
) => {
  const isAssigned = checkIsIssueAssignedToMe(enrichedIssue, currentUserId);
  const acceptEnabled = isAcceptEnabled(statuses, enrichedIssue, isAssigned);
  const recordResolutionEnabled = isRecordResolutionEnabled(statuses, enrichedIssue, isAssigned);
  const rateAppealEnabled = isRateAppealEnabled(statuses, enrichedIssue, isAssigned);
  const escalateEnabled = isEscalateEnabled(
    recordResolutionEnabled,
    enrichedIssue,
    disableEscalation
  );

  return {
    isIssueAssignedToMe: isAssigned,
    isAcceptEnabled: acceptEnabled,
    isRecordResolutionEnabled: recordResolutionEnabled,
    isRateAppealEnabled: rateAppealEnabled,
    isEscalateEnabled: escalateEnabled,
  };
};
```

### Assignment Logic
```javascript
// From issueButtonUtils.js - checkIsIssueAssignedToMe()
export const checkIsIssueAssignedToMe = (enrichedIssue, currentUserId) => {
  if (!enrichedIssue || !currentUserId) return false;

  const assigneeId = enrichedIssue.assignee;
  const reporterId = enrichedIssue.reporter;

  if (assigneeId) {
    return assigneeId === currentUserId;
  }

  // Fallback: if no assignee but reporter is the current user
  if (reporterId === currentUserId) {
    return true;
  }

  return false;
};
```

## Status Transition Matrix

| Action | From Status | To Status | Condition |
|--------|-------------|-----------|-----------|
| Accept | `initial_status = true` OR Unknown | `open_status = true` | User assigned |
| Reject | `initial_status = true` OR Unknown | `rejected_status = true` | User assigned |
| Record Steps | `open_status = true` | No change | User assigned, not escalated |
| Record Resolution | `open_status = true` | `final_status = true` | User assigned, not escalated |
| Escalate | `open_status = true` | No change | User assigned, not escalated, not already escalated |
| Rate | `final_status = true` | No change | Any user |
| Appeal | `final_status = true` | `open_status = true` | Any user |

## Form Input Requirements

### Input Validation
```javascript
// From useIssueActions.js - validateInput()
const validateInput = useCallback(
  (actionType) => {
    const validators = {
      [ACTION_TYPES.REJECT]: () => formInputs.reason.trim() !== '',
      [ACTION_TYPES.ESCALATE]: () => formInputs.escalateComment.trim() !== '',
      [ACTION_TYPES.RECORD_STEPS]: () => formInputs.comment.trim() !== '',
      [ACTION_TYPES.RECORD_RESOLUTION]: () => formInputs.resolution.trim() !== '',
      [ACTION_TYPES.RATE]: () => formInputs.rating > 0,
    };

    const validator = validators[actionType];
    return validator ? validator() : true;
  },
  [formInputs]
);
```

### Form State Management
```javascript
// From useIssueActions.js - Form inputs state
const [formInputs, setFormInputs] = useState({
  reason: '',           // For reject and appeal
  escalateComment: '',  // For escalate
  comment: '',         // For record steps
  resolution: '',      // For record resolution
  rating: 0,          // For rate (1-5)
});
```

## Database Field Mappings

### WatermelonDB Field Assignment Rules

**✅ CORRECT - Foreign Key Fields (use `_setRaw`)**:
```javascript
issue._setRaw('status', statusId);
issue._setRaw('assignee', currentUserId);
issue._setRaw('rejected_by', currentUserId);
issue._setRaw('resolved_by', currentUserId);
issue._setRaw('escalated_by', currentUserId);
```

**✅ CORRECT - Regular Fields (direct assignment)**:
```javascript
issue.rejectReason = reason;
issue.rejectedDate = new Date();
issue.rating = 5;
issue.escalateFlag = true;
issue.resolutionText = resolution;
issue.escalationReason = reason;
issue.appealSubmitted = true;
```

### Comment and Log Creation
```javascript
// Comment creation
await db.get('grm_issue_comments').create((commentRecord) => {
  commentRecord._setRaw('grm_issue', enrichedIssue.id);
  commentRecord._setRaw('user', currentUserId);
  commentRecord.comment = getCommentText();
  commentRecord.activityType = actionType;
  commentRecord.createdAt = now;
  commentRecord.updatedAt = now;
});

// Log creation
await db.get('grm_issue_logs').create((logRecord) => {
  logRecord._setRaw('grm_issue', enrichedIssue.id);
  logRecord._setRaw('user', currentUserId);
  logRecord.actionTaken = logData.actionTaken;
  logRecord.text = logData.text;
  logRecord.timestamp = now;
  logRecord.createdAt = now;
  logRecord.updatedAt = now;
});
```

## Dialog Management System

### Dialog Types and States
```javascript
// From issueActionTypes.js
export const DIALOG_TYPES = {
  ACCEPT: 'accept',
  REJECT: 'reject',
  RECORD_STEPS: 'recordSteps',
  RECORD_RESOLUTION: 'recordResolution',
  ESCALATE: 'escalate',
  RATING: 'rating',
  RATE_APPEAL: 'rateAppeal',
};

export const DIALOG_STATES = {
  INITIAL: 'initial',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  ERROR: 'error',
};
```

### Dialog Flow Management
```javascript
// From useIssueActions.js - Dialog state management
const [dialogs, setDialogs] = useState({
  [DIALOG_TYPES.ACCEPT]: { visible: false, state: DIALOG_STATES.INITIAL },
  [DIALOG_TYPES.REJECT]: { visible: false, state: DIALOG_STATES.INITIAL },
  [DIALOG_TYPES.RECORD_STEPS]: { visible: false, state: DIALOG_STATES.INITIAL },
  [DIALOG_TYPES.RECORD_RESOLUTION]: { visible: false, state: DIALOG_STATES.INITIAL },
  [DIALOG_TYPES.ESCALATE]: { visible: false, state: DIALOG_STATES.INITIAL },
  [DIALOG_TYPES.RATING]: { visible: false, state: DIALOG_STATES.INITIAL },
  [DIALOG_TYPES.RATE_APPEAL]: { visible: false, state: DIALOG_STATES.INITIAL },
});
```

## Error Handling and Validation

### Database Update Validation
```javascript
// From useIssueActions.js - Error handling in executeAction
try {
  const newStatus = getStatusForAction(actionType, statuses);

  if (newStatus === undefined) {
    console.error(`❌ [IssueActions] No appropriate status found for action: ${actionType}`);
    showToast(t('error_no_appropriate_status_found'));
    return false;
  }

  await saveIssueStatus(newStatus, actionType, additionalData);
  handlePostActionUpdates(actionType);

  // Force button state recalculation
  setActionStates((prev) => ({ ...prev, lastActionTimestamp: Date.now() }));

  return true;
} catch (error) {
  console.error('❌ [IssueActions] Error executing action:', error);
  showToast(t('error_updating_issue_status') || 'Error updating issue. Please try again.');
  return false;
} finally {
  setActionStates((prev) => ({ ...prev, isUpdating: false }));
}
```

## Translation Keys Used

### Button Labels
- `accept_issue`: "Accept Issue"
- `record_steps_taken`: "Record Steps Taken"
- `record_resolution`: "Record Resolution"
- `rate_appeal`: "Rate/Appeal"
- `escalate`: "Escalate"

### Action Types (for logs)
- `accepted_issue`: "Accepted issue"
- `rejected_issue`: "Rejected issue"
- `added_steps`: "Added steps"
- `resolved_issue`: "Resolved issue"
- `escalated_issue`: "Escalated issue"
- `rated_issue`: "Rated issue"
- `submitted_appeal`: "Submitted appeal"

### Comment Templates
- `issue_was_accepted_by_user`: "Issue was accepted by {user}"
- `appeal_submitted_by_citizen`: "Appeal submitted by citizen"

### Explanation Text
- `issue_accepted_explanation`: "Issue has been accepted and assigned for processing"
- `appeal_submitted_explanation`: "Appeal has been submitted for review"

### Error Messages
- `error_no_issue_data`: "No issue data available"
- `error_no_appropriate_status_found`: "No appropriate status found"
- `error_updating_issue_status`: "Error updating issue status. Please try again."
- `please_provide_rejection_reason`: "Please provide rejection reason"
- `please_provide_escalation_reason`: "Please provide escalation reason"
- `please_provide_steps_taken`: "Please provide steps taken"
- `please_provide_resolution_details`: "Please provide resolution details"
- `please_select_rating`: "Please select rating"

## Performance Optimizations

### Memoized Calculations
```javascript
// From useIssueActions.js - Optimized button state calculation
const buttonStates = useMemo(() => {
  if (!enrichedIssue || !statuses || statuses.length === 0) {
    return {
      isIssueAssignedToMe: false,
      isAcceptEnabled: false,
      isRecordResolutionEnabled: false,
      isRateAppealEnabled: false,
      isEscalateEnabled: false,
    };
  }

  return calculateButtonStates(
    statuses,
    enrichedIssue,
    currentUserId,
    actionStates.disableEscalation
  );
}, [
  enrichedIssue?.id,
  enrichedIssue?.status,
  enrichedIssue?.assignee,
  enrichedIssue?.escalate_flag,
  statuses?.length,
  currentUserId,
  actionStates.disableEscalation,
  actionStates.lastActionTimestamp,
]);
```

### Efficient State Updates
```javascript
// Force refresh mechanism
useEffect(() => {
  if (!actionStates.isUpdating && actionStates.lastActionTimestamp > 0) {
    console.log('🔄 [IssueActions] Action completed, refreshing issue data');
    setRefreshTrigger((prev) => prev + 1);
  }
}, [actionStates.isUpdating, actionStates.lastActionTimestamp]);
```

## Implementation Benefits

1. **Centralized Logic**: All button logic consolidated in `useIssueActions` hook
2. **Type Safety**: Consistent action types and dialog types via constants
3. **Validation**: Input validation for all user-provided data
4. **Error Handling**: Comprehensive error catching and user feedback
5. **Performance**: Memoized calculations and efficient state updates
6. **Maintainability**: Clean separation of concerns and DRY principles
7. **Offline-First**: WatermelonDB integration with automatic sync
8. **User Experience**: Immediate feedback and smooth dialog transitions
9. **Internationalization**: Comprehensive translation key usage
10. **Accessibility**: Proper button enablement and visual feedback

## Future Enhancements

1. **Role-based Permissions**: Integration with user roles for fine-grained access
2. **Workflow Integration**: Custom workflow support for complex approval processes
3. **Bulk Actions**: Support for bulk status updates
4. **Advanced Validation**: Real-time validation and conflict detection
5. **Analytics**: Action tracking and performance metrics
6. **Notification System**: Push notifications for status changes
7. **Audit Trail**: Enhanced audit logging with user context
8. **Offline Conflict Resolution**: Advanced conflict handling for offline operations 
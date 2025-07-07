/**
 * Issue Button Utilities - Clean logic for determining button states
 * Follows DRY and KISS principles by extracting complex button enablement logic
 */

/**
 * Check if accept button should be enabled
 * RULE: Accept button enabled when:
 * 1. Issue is in initial status (newly submitted) AND current user is assigned to the issue AND current issue status matches this status
 * OR Issue has unknown status and is assigned to current user
 */
export const isAcceptEnabled = (statuses, enrichedIssue, isIssueAssignedToMe) => {
  if (!statuses || !enrichedIssue) return false;
  
  const currentStatusId = enrichedIssue.status.id;
  
  // Check for initial status match
  const hasInitialStatusMatch = statuses.some((status) => {
    const statusData = status._raw || status;
    return (
      statusData.initial_status === true && isIssueAssignedToMe && currentStatusId === statusData.id
    );
  });
  
  // Check for unknown status and assigned
  const isUnknownStatusAndAssigned =
    (!currentStatusId || currentStatusId === '') && isIssueAssignedToMe;

  return hasInitialStatusMatch || isUnknownStatusAndAssigned;
};

/**
 * Check if record resolution buttons should be enabled
 * RULE: Record resolution buttons enabled when:
 * 1. Issue is in open status (being worked on)
 * 2. Current user is assigned to the issue
 * 3. Issue has not been escalated
 * 4. Current issue status matches this status
 */
export const isRecordResolutionEnabled = (statuses, enrichedIssue, isIssueAssignedToMe) => {
  if (!statuses || !enrichedIssue || !isIssueAssignedToMe || enrichedIssue.escalate_flag) {
    return false;
  }

  const currentStatusId = enrichedIssue.status.id;

  return statuses.some((status) => {
    const statusData = status._raw || status;
    return statusData.open_status === true && currentStatusId === statusData.id;
  });
};

/**
 * Check if rate/appeal button should be enabled
 * RULE: Rate/Appeal button enabled when:
 * 1. Issue is in final status (resolved/closed)
 * 2. Current issue status matches this status
 * Note: Removed user assignment restriction per user request
 */
export const isRateAppealEnabled = (statuses, enrichedIssue, isIssueAssignedToMe) => {
  if (!statuses || !enrichedIssue) {
    return false;
  }

  const currentStatusId = enrichedIssue.status.id;

  return statuses.some((status) => {
    const statusData = status._raw || status;
    return statusData.final_status === true && currentStatusId === statusData.id;
  });
};

/**
 * Check if escalate button should be enabled
 * RULE: Escalate button enabled when:
 * 1. Record resolution buttons are enabled (open status + assigned)
 * 2. Issue has not been escalated yet
 * 3. Escalation is not disabled
 */
export const isEscalateEnabled = (
  isRecordResolutionEnabled,
  enrichedIssue,
  disableEscalation = false
) => {
  return isRecordResolutionEnabled && !enrichedIssue?.escalate_flag && !disableEscalation;
};

/**
 * Check if current user is assigned to the issue
 */
export const checkIsIssueAssignedToMe = (enrichedIssue, currentUserId) => {
  if (!enrichedIssue || !currentUserId) return false;
  
  // Check assignee from raw data
  const assigneeId = enrichedIssue.assignee.id;
  const reporterId = enrichedIssue.reporter.id;
  
  if (assigneeId) {
    return assigneeId === currentUserId;
  }

  // Fallback: if no assignee but reporter is the current user
  if (reporterId === currentUserId) {
    return true;
  }

  return false;
};

/**
 * Calculate all button states at once - more efficient than individual calls
 */
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

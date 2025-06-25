/**
 * Issue History Utilities - Clean logic for processing comments and activities
 * Reduces complexity in IssueHistory component and follows DRY principles
 */

import { ACTION_TYPES } from './issueActionTypes';

/**
 * Create user lookup map for performance
 */
export const createUserLookupMap = (users) => {
  const map = new Map();
  if (!users || !Array.isArray(users)) return map;

  users.forEach((user) => {
    const userData = user._raw || user;
    if (userData && userData.id) {
      map.set(userData.id, userData.full_name || userData.email || userData.id);
    }
  });

  return map;
};

/**
 * Determine activity type and display text based on comment data
 */
export const processActivityType = (rawComment, t) => {
  const activityType = rawComment.activity_type;
  let displayText = rawComment.comment;
  let fullText = rawComment.comment;

  const activityMappings = {
    [ACTION_TYPES.ACCEPT]: {
      type: t('accept_issue') || 'Issue Accepted',
      display: (userName) => `${t('accept_issue') || 'Issue Accepted'} by ${userName}`,
      full:
        t('issue_accepted_explanation') || 'Issue has been accepted and assigned for processing',
    },
    [ACTION_TYPES.REJECT]: {
      type: t('reject_issue') || 'Issue Rejected',
      display: (userName) => `${t('reject_issue') || 'Issue Rejected'} by ${userName}`,
      full: rawComment.comment,
    },
    [ACTION_TYPES.RECORD_STEPS]: {
      type: t('record_steps_taken') || 'Steps Recorded',
      display: rawComment.comment,
      full: rawComment.comment,
    },
    [ACTION_TYPES.RECORD_RESOLUTION]: {
      type: t('record_resolution') || 'Issue Resolved',
      display: rawComment.comment,
      full: rawComment.comment,
    },
    [ACTION_TYPES.ESCALATE]: {
      type: t('escalate') || 'Issue Escalated',
      display: (userName) => `${t('escalate') || 'Issue Escalated'} by ${userName}`,
      full: rawComment.comment,
    },
    [ACTION_TYPES.RATE]: {
      type: t('rate_issue') || 'Issue Rated',
      display: rawComment.comment,
      full: rawComment.comment,
    },
    [ACTION_TYPES.APPEAL]: {
      type: t('appeal_submitted') || 'Appeal Submitted',
      display: (userName) => `${t('appeal_submitted') || 'Appeal Submitted'} by ${userName}`,
      full: t('appeal_submitted_explanation') || 'Appeal has been submitted for review',
    },
  };

  const mapping = activityMappings[activityType];
  if (mapping) {
    return {
      type: mapping.type,
      display: typeof mapping.display === 'function' ? mapping.display : mapping.display,
      full: mapping.full,
    };
  }

  // Default case
  return {
    type: activityType || 'General Activity',
    display: displayText,
    full: fullText,
  };
};

/**
 * Process a single comment record
 */
export const processComment = (commentRecord, userMap, t) => {
  const rawComment = commentRecord._raw || commentRecord;
  const userName = userMap.get(rawComment.user_id) || rawComment.user_id || 'System';

  const activity = processActivityType(rawComment, t);

  return {
    id: rawComment.id,
    comment_text:
      typeof activity.display === 'function' ? activity.display(userName) : activity.display,
    full_text: activity.full,
    activity_type: activity.type,
    comment_by: userName,
    comment_date: rawComment.created_at,
    user_id: rawComment.user_id,
  };
};

/**
 * Process all comments from database
 */
export const processComments = (commentsFromDB, userMap, t) => {
  if (!commentsFromDB || commentsFromDB.length === 0) {
    console.log('🔍 [IssueHistory] No comments found from database');
    return [];
  }

  console.log('🔍 [IssueHistory] Loading comments from database:', commentsFromDB.length);

  const processedComments = commentsFromDB.map((commentRecord) =>
    processComment(commentRecord, userMap, t)
  );

  console.log('✅ [IssueHistory] Processed comments:', processedComments.length);
  return processedComments;
};

/**
 * Check if activity type should show detailed content
 */
export const shouldShowDetailedContent = (activityType, t) => {
  const detailedActivityTypes = [
    t('record_steps_taken') || 'Steps Recorded',
    t('record_resolution') || 'Issue Resolved',
  ];

  return detailedActivityTypes.includes(activityType);
};

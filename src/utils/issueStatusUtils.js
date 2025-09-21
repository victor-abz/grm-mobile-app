/**
 * Issue Status Utilities - Clean logic for finding appropriate statuses
 * Replaces complex status finding logic scattered throughout components
 */

import { ACTION_TYPES } from './issueActionTypes';
import { logger } from './logger';

/**
 * Find status by specific property
 */
const findStatusByProperty = (statuses, property, value = true) => {
  if (!statuses || !Array.isArray(statuses)) return null;

  return statuses.find((status) => {
    const statusData = status._raw || status;
    return statusData[property] === value;
  });
};

/**
 * Get the appropriate status for each action type
 */
export const getStatusForAction = (actionType, statuses) => {
  if (!statuses || !Array.isArray(statuses)) {
    logger.warn('IssueStatus: Invalid statuses provided for action', {
      actionType,
      statusesValid: false,
    });
    return null;
  }

  const statusMappings = {
    [ACTION_TYPES.ACCEPT]: () => findStatusByProperty(statuses, 'open_status'),
    [ACTION_TYPES.REJECT]: () => findStatusByProperty(statuses, 'rejected_status'),
    [ACTION_TYPES.RECORD_RESOLUTION]: () => findStatusByProperty(statuses, 'final_status'),
    [ACTION_TYPES.APPEAL]: () => findStatusByProperty(statuses, 'open_status'),
    // Actions that don't change status
    [ACTION_TYPES.RECORD_STEPS]: () => null,
    [ACTION_TYPES.ESCALATE]: () => null,
    [ACTION_TYPES.RATE]: () => null,
  };

  const statusFinder = statusMappings[actionType];
  const result = statusFinder ? statusFinder() : null;

  if (!result && statusFinder) {
    logger.warn('IssueStatus: No status found for action', {
      actionType,
      statusesCount: statuses.length,
    });
  }

  return result;
};

/**
 * Get available statuses by type
 */
export const getStatusesByType = (statuses) => {
  if (!statuses || !Array.isArray(statuses)) return {};

  return {
    initial: statuses.filter((status) => (status._raw || status).initial_status === true),
    open: statuses.filter((status) => (status._raw || status).open_status === true),
    final: statuses.filter((status) => (status._raw || status).final_status === true),
    rejected: statuses.filter((status) => (status._raw || status).rejected_status === true),
  };
};

/**
 * Create status lookup map for performance
 */
export const createStatusLookupMap = (statuses, labelField = 'status_name') => {
  const map = new Map();
  if (!statuses || !Array.isArray(statuses)) return map;

  statuses.forEach((status) => {
    const statusData = status._raw || status;
    if (statusData && statusData.id) {
      const label = statusData[labelField] || statusData.name || statusData.id;
      map.set(statusData.id, label);
    }
  });

  return map;
};

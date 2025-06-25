/**
 * Issue Action Types - Constants for action management
 * Prevents magic strings and ensures consistency across the application
 */

export const ACTION_TYPES = {
  ACCEPT: 'accept',
  REJECT: 'reject',
  RECORD_STEPS: 'record_steps',
  RECORD_RESOLUTION: 'record_resolution',
  ESCALATE: 'escalate',
  RATE: 'rate',
  APPEAL: 'appeal',
  NONE: 'none',
};

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

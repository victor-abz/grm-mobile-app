/**
 * useIssueActions Hook - Centralized action state management
 * Replaces scattered useState calls and repetitive dialog management
 * Follows DRY principle by consolidating all action-related logic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ToastAndroid } from 'react-native';
import moment from 'moment';
import watermelonManager from '../database/watermelonManager';
import { ACTION_TYPES, DIALOG_TYPES, DIALOG_STATES } from '../utils/issueActionTypes';
import { getStatusForAction } from '../utils/issueStatusUtils';
import { calculateButtonStates } from '../utils/issueButtonUtils';

/**
 * Central hook for managing issue actions
 */
export const useIssueActions = (enrichedIssue, statuses, currentUserId, navigation, t) => {
  // ========== STATE MANAGEMENT ==========
  // Centralized dialog state
  const [dialogs, setDialogs] = useState({
    [DIALOG_TYPES.ACCEPT]: { visible: false, state: DIALOG_STATES.INITIAL },
    [DIALOG_TYPES.REJECT]: { visible: false, state: DIALOG_STATES.INITIAL },
    [DIALOG_TYPES.RECORD_STEPS]: { visible: false, state: DIALOG_STATES.INITIAL },
    [DIALOG_TYPES.RECORD_RESOLUTION]: { visible: false, state: DIALOG_STATES.INITIAL },
    [DIALOG_TYPES.ESCALATE]: { visible: false, state: DIALOG_STATES.INITIAL },
    [DIALOG_TYPES.RATING]: { visible: false, state: DIALOG_STATES.INITIAL },
    [DIALOG_TYPES.RATE_APPEAL]: { visible: false, state: DIALOG_STATES.INITIAL },
  });

  // Form inputs state
  const [formInputs, setFormInputs] = useState({
    reason: '',
    escalateComment: '',
    comment: '',
    resolution: '',
    rating: 0,
  });

  // Action states
  const [actionStates, setActionStates] = useState({
    isUpdating: false,
    disableEscalation: false,
    lastActionTimestamp: 0,
  });

  // ========== COMPUTED VALUES ==========
  // Memoize button states calculation for performance
  const buttonStates = useMemo(() => {
    if (!enrichedIssue || !statuses || statuses.length === 0) {
      // Return default state when data is not ready, but buttons should still be visible
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

  const citizenName = useMemo(() => {
    if (!enrichedIssue) return '';

    if (enrichedIssue.citizen_type !== 'Confidential') {
      return enrichedIssue.citizen;
    } else {
      return buttonStates.isIssueAssignedToMe ? enrichedIssue.citizen : 'Anonymous';
    }
  }, [enrichedIssue?.citizen, enrichedIssue?.citizen_type, buttonStates.isIssueAssignedToMe]);

  // ========== DIALOG MANAGEMENT ==========
  const showDialog = useCallback((dialogType, state = DIALOG_STATES.INITIAL) => {
    setDialogs((prev) => ({
      ...prev,
      [dialogType]: { visible: true, state },
    }));
  }, []);

  const hideDialog = useCallback((dialogType) => {
    setDialogs((prev) => ({
      ...prev,
      [dialogType]: { visible: false, state: DIALOG_STATES.INITIAL },
    }));
  }, []);

  const updateDialogState = useCallback((dialogType, state) => {
    setDialogs((prev) => ({
      ...prev,
      [dialogType]: { ...prev[dialogType], state },
    }));
  }, []);

  // ========== FORM INPUT MANAGEMENT ==========
  const updateFormInput = useCallback((field, value) => {
    setFormInputs((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const resetFormInputs = useCallback(() => {
    setFormInputs({
      reason: '',
      escalateComment: '',
      comment: '',
      resolution: '',
      rating: 0,
    });
  }, []);

  // ========== VALIDATION ==========
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

  // ========== TOAST UTILITY ==========
  const showToast = useCallback((message) => {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }, []);

  // ========== CORE ACTION PROCESSOR ==========
  const executeAction = useCallback(
    async (actionType, additionalData = {}) => {
      if (!enrichedIssue) {
        showToast(t('error_no_issue_data') || 'No issue data available');
        return false;
      }

      // Validate input if required
      if (!validateInput(actionType)) {
        const errorMessages = {
          [ACTION_TYPES.REJECT]: t('please_provide_rejection_reason'),
          [ACTION_TYPES.ESCALATE]: t('please_provide_escalation_reason'),
          [ACTION_TYPES.RECORD_STEPS]: t('please_provide_steps_taken'),
          [ACTION_TYPES.RECORD_RESOLUTION]: t('please_provide_resolution_details'),
          [ACTION_TYPES.RATE]: t('please_select_rating'),
        };
        showToast(errorMessages[actionType] || t('please_fill_required_fields'));
        return false;
      }

      setActionStates((prev) => ({ ...prev, isUpdating: true }));

      try {
        const newStatus = getStatusForAction(actionType, statuses);

        if (newStatus === undefined) {
          console.error(`❌ [IssueActions] No appropriate status found for action: ${actionType}`);
          showToast(t('error_no_appropriate_status_found'));
          return false;
        }

        await saveIssueStatus(newStatus, actionType, additionalData);
        handlePostActionUpdates(actionType);

        // Force button state recalculation by updating a dependency
        setActionStates((prev) => ({ ...prev, lastActionTimestamp: Date.now() }));

        return true;
      } catch (error) {
        console.error('❌ [IssueActions] Error executing action:', error);
        showToast(t('error_updating_issue_status') || 'Error updating issue. Please try again.');
        return false;
      } finally {
        setActionStates((prev) => ({ ...prev, isUpdating: false }));
      }
    },
    [enrichedIssue, formInputs, statuses, t, validateInput]
  );

  // ========== WATERMELON DB OPERATIONS ==========
  const saveIssueStatus = useCallback(
    async (newStatus, actionType, additionalData = {}) => {
      const db = watermelonManager.getDatabase();

      await db.write(async () => {
        // Update issue record
        const issueRecord = await db.get('grm_issues').find(enrichedIssue.id);

        await issueRecord.update((issue) => {
          // Handle status change
          if (newStatus) {
            const statusId = newStatus.id || newStatus._raw?.id;
            issue._setRaw('status', statusId);
          }

          // Apply action-specific updates
          const now = new Date();
          const actionUpdates = {
            [ACTION_TYPES.ACCEPT]: () => {
              issue._setRaw('assignee', currentUserId);
              issue.acceptedDate = now;
            },
            [ACTION_TYPES.REJECT]: () => {
              issue.rejectReason = formInputs.reason;
              issue.rejectedDate = now;
              issue._setRaw('rejected_by', currentUserId);
            },
            [ACTION_TYPES.RECORD_RESOLUTION]: () => {
              issue.resolutionText = formInputs.resolution;
              issue.resolutionDate = now;
              issue._setRaw('resolved_by', currentUserId);
            },
            [ACTION_TYPES.ESCALATE]: () => {
              issue.escalateFlag = true;
              issue.escalatedDate = now;
              issue._setRaw('escalated_by', currentUserId);
              issue.escalationReason = formInputs.escalateComment;
            },
            [ACTION_TYPES.RATE]: () => {
              if (formInputs.rating > 0) {
                issue.rating = formInputs.rating;
                issue.ratedDate = now;
              }
            },
            [ACTION_TYPES.APPEAL]: () => {
              issue.appealSubmitted = true;
              issue.appealDate = now;
              // Store appeal reason from the rating dialog if provided
              if (formInputs.reason && formInputs.reason.trim()) {
                issue.appealReason = formInputs.reason;
              }
              // Keep rating if it was provided
              if (formInputs.rating > 0) {
                issue.rating = formInputs.rating;
              }
            },
          };

          const updateAction = actionUpdates[actionType];
          if (updateAction) updateAction();

          // Apply additional data
          Object.keys(additionalData).forEach((key) => {
            if (additionalData[key] !== undefined && issue[key] !== undefined) {
              issue[key] = additionalData[key];
            }
          });

          issue.updatedAt = now;
        });

        // Create comment and log entries
        await createActionRecords(db, actionType);
      });
    },
    [enrichedIssue, currentUserId, formInputs]
  );

  // ========== CREATE ACTION RECORDS ==========
  const createActionRecords = useCallback(
    async (db, actionType) => {
      const now = new Date();

      // Determine comment text based on action type
      const getCommentText = () => {
        const commentMappings = {
          [ACTION_TYPES.RECORD_STEPS]: formInputs.comment,
          [ACTION_TYPES.REJECT]: formInputs.reason,
          [ACTION_TYPES.ESCALATE]: formInputs.escalateComment,
          [ACTION_TYPES.RECORD_RESOLUTION]: formInputs.resolution,
          [ACTION_TYPES.RATE]:
            formInputs.rating > 0 ? `Rating: ${formInputs.rating}/5` : 'No rating provided',
          [ACTION_TYPES.ACCEPT]: t('issue_was_accepted_by_user', { user: currentUserId }),
          [ACTION_TYPES.APPEAL]: formInputs.reason || t('appeal_submitted_by_citizen'),
        };
        return commentMappings[actionType] || t('status_updated');
      };

      // Create comment record
      await db.get('grm_issue_comments').create((commentRecord) => {
        commentRecord._setRaw('grm_issue', enrichedIssue.id);
        commentRecord._setRaw('user', currentUserId);
        commentRecord.comment = getCommentText();
        commentRecord.activityType = actionType;
        commentRecord.createdAt = now;
        commentRecord.updatedAt = now;
      });

      // Create log record
      await db.get('grm_issue_logs').create((logRecord) => {
        logRecord._setRaw('grm_issue', enrichedIssue.id);
        logRecord._setRaw('user', currentUserId);

        const logMappings = {
          [ACTION_TYPES.ACCEPT]: {
            actionTaken: t('accepted_issue') || 'Accepted issue',
            text:
              t('issue_accepted_explanation') ||
              'Issue has been accepted and assigned for processing',
          },
          [ACTION_TYPES.REJECT]: {
            actionTaken: t('rejected_issue') || 'Rejected issue',
            text: formInputs.reason,
          },
          [ACTION_TYPES.RECORD_STEPS]: {
            actionTaken: t('added_steps') || 'Added steps',
            text: formInputs.comment,
          },
          [ACTION_TYPES.RECORD_RESOLUTION]: {
            actionTaken: t('resolved_issue') || 'Resolved issue',
            text: formInputs.resolution,
          },
          [ACTION_TYPES.ESCALATE]: {
            actionTaken: t('escalated_issue') || 'Escalated issue',
            text: formInputs.escalateComment,
          },
          [ACTION_TYPES.RATE]: {
            actionTaken: t('rated_issue') || 'Rated issue',
            text: formInputs.rating > 0 ? `Rating: ${formInputs.rating}/5` : 'No rating provided',
          },
          [ACTION_TYPES.APPEAL]: {
            actionTaken: t('submitted_appeal') || 'Submitted appeal',
            text:
              formInputs.reason ||
              t('appeal_submitted_explanation') ||
              'Appeal has been submitted for review',
          },
        };

        const logData = logMappings[actionType] || {
          actionTaken: t('updated_status') || 'Updated status',
          text: t('status_updated_explanation') || 'Issue status has been updated',
        };

        logRecord.actionTaken = logData.actionTaken;
        logRecord.text = logData.text;
        logRecord.timestamp = now;
        logRecord.createdAt = now;
        logRecord.updatedAt = now;
      });
    },
    [enrichedIssue, currentUserId, formInputs, t]
  );

  // ========== POST-ACTION UPDATES ==========
  const handlePostActionUpdates = useCallback(
    (actionType) => {
      const postActionHandlers = {
        [ACTION_TYPES.ACCEPT]: () => {
          resetFormInputs();
          updateDialogState(DIALOG_TYPES.ACCEPT, DIALOG_STATES.SUCCESS);
          setTimeout(() => hideDialog(DIALOG_TYPES.ACCEPT), 1500);
        },
        [ACTION_TYPES.REJECT]: () => {
          resetFormInputs();
          updateDialogState(DIALOG_TYPES.REJECT, DIALOG_STATES.SUCCESS);
          setTimeout(() => hideDialog(DIALOG_TYPES.REJECT), 1500);
        },
        [ACTION_TYPES.RECORD_RESOLUTION]: () => {
          resetFormInputs();
          hideDialog(DIALOG_TYPES.RECORD_RESOLUTION);
        },
        [ACTION_TYPES.ESCALATE]: () => {
          resetFormInputs();
          setActionStates((prev) => ({ ...prev, disableEscalation: true }));
          updateDialogState(DIALOG_TYPES.ESCALATE, DIALOG_STATES.SUCCESS);
          setTimeout(() => hideDialog(DIALOG_TYPES.ESCALATE), 1500);
        },
        [ACTION_TYPES.RECORD_STEPS]: () => {
          resetFormInputs();
          updateDialogState(DIALOG_TYPES.RECORD_STEPS, DIALOG_STATES.SUCCESS);
          setTimeout(() => hideDialog(DIALOG_TYPES.RECORD_STEPS), 1500);
        },
        [ACTION_TYPES.RATE]: () => {
          if (formInputs.rating === 0) {
            // Don't reset inputs here as we're moving to appeal dialog
            showDialog(DIALOG_TYPES.RATE_APPEAL);
          } else {
            resetFormInputs();
            hideDialog(DIALOG_TYPES.RATING);
          }
        },
        [ACTION_TYPES.APPEAL]: () => {
          resetFormInputs();
          hideDialog(DIALOG_TYPES.RATE_APPEAL);
        },
      };

      const handler = postActionHandlers[actionType];
      if (handler) handler();
    },
    [formInputs.rating, hideDialog, showDialog, updateDialogState, resetFormInputs]
  );

  // ========== NAVIGATION HANDLERS ==========
  const goToDetails = useCallback(() => navigation.jumpTo('IssueDetail'), [navigation]);
  const goToHistory = useCallback(() => {
    hideDialog(DIALOG_TYPES.RECORD_STEPS);
    navigation.jumpTo('History');
  }, [navigation, hideDialog]);

  // ========== EFFECTS ==========
  // Initialize rating from issue data
  useEffect(() => {
    if (enrichedIssue?.rating) {
      setFormInputs((prev) => ({ ...prev, rating: enrichedIssue.rating }));
    }
  }, [enrichedIssue?.rating]);

  // ========== RETURN API ==========
  return {
    // State
    dialogs,
    formInputs,
    actionStates,
    buttonStates,
    citizenName,

    // Dialog management
    showDialog,
    hideDialog,
    updateDialogState,

    // Form management
    updateFormInput,
    resetFormInputs,

    // Action execution
    executeAction,

    // Navigation
    goToDetails,
    goToHistory,

    // Utilities
    showToast,
    validateInput,
  };
};

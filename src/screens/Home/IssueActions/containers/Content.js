import { AntDesign, Feather } from '@expo/vector-icons';
import moment from 'moment';
import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Button,
  Dialog,
  IconButton,
  Paragraph,
  Portal,
  RadioButton,
  TextInput,
} from 'react-native-paper';
import StarRating from 'react-native-star-rating-widget';
import { useData } from '../../../../providers/DataProvider';
import { colors } from '../../../../utils/colors';
import { styles } from './Content.styles';
import watermelonManager from '../../../../database/watermelonManager';

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: '#dedede',
    text: '#707070',
  },
};

const WHATSAPP_LINK = 'http://api.whatsapp.com/send?phone=223';
const PHONE_CALL_LINK = 'tel://+223';

function Content({ issue, navigation, statuses = [], userContext }) {
  const { t } = useTranslation();
  const { dataManager } = useData();

  // Debug logging for IssueActions
  console.log('🔍 [IssueActions] Processing issue data:', {
    isArray: Array.isArray(issue),
    issue: issue?._raw ? 'WatermelonDB Object' : 'Raw Object',
  });

  if (issue && issue._raw) {
    console.log('🔍 [IssueActions] Raw issue data:', {
      id: issue._raw.id,
      status_id: issue._raw.status_id,
      assignee_id: issue._raw.assignee_id,
      reporter_id: issue._raw.reporter_id,
      issue_date: issue._raw.issue_date,
      intake_date: issue._raw.intake_date,
    });
  }

  console.log('🔍 [IssueActions] User context:', {
    user: userContext?.user,
    hasPermissions: !!userContext?.permissions,
    hasAssignments: !!userContext?.assignments,
  });

  // Get current user ID from context
  const currentUserId =
    userContext?.user?.id || userContext?.user?.name || userContext?.user?.email;

  // Create lookup helper function
  const createLookupMap = (items, labelField) => {
    const map = new Map();
    if (!items || !Array.isArray(items)) return map;

    items.forEach((item) => {
      const rawItem = item._raw || item;
      if (rawItem && rawItem.id) {
        const label = rawItem[labelField] || rawItem.name || rawItem.id;
        map.set(rawItem.id, label);
      }
    });
    return map;
  };

  // Create lookup maps for statuses
  const statusMap = useMemo(() => createLookupMap(statuses, 'status_name'), [statuses]);

  // Enrich issue data with lookup labels
  const enrichedIssue = useMemo(() => {
    if (!issue) return null;

    const issueData = Array.isArray(issue) ? issue[0] : issue;
    if (!issueData) return null;

    const rawData = issueData._raw || issueData;

    const enriched = {
      ...rawData,

      // Add resolved labels
      statusLabel: statusMap.get(rawData.status_id) || rawData.status_id || 'Unknown',

      // Format dates
      issueDateFormatted: rawData.issue_date
        ? moment(rawData.issue_date).format('DD-MMM-YYYY HH:mm')
        : '',
      intakeDateFormatted: rawData.intake_date
        ? moment(rawData.intake_date).format('DD-MMM-YYYY HH:mm')
        : '',

      // Calculate days ago
      daysAgo: rawData.intake_date ? moment().diff(moment(rawData.intake_date), 'days') : 0,

      // Backward compatibility fields
      status: {
        id: rawData.status_id,
        name: statusMap.get(rawData.status_id) || rawData.status_id,
      },
      assignee: {
        id: rawData.assignee_id,
        name: rawData.assignee_id,
      },
      reporter: {
        id: rawData.reporter_id,
        name: rawData.reporter_id,
      },

      // Contact information handling
      contact_information: rawData.contact_information
        ? {
            contact: rawData.contact_information,
            type: rawData.contact_info_type,
          }
        : null,

      // Handle citizen data
      citizen: rawData.citizen || 'Anonymous',
      citizen_type: rawData.citizen_type,

      // Other fields
      description: rawData.description || '',
      rating: rawData.rating || null,
      escalate_flag: rawData.escalate_flag || false,
      comments: rawData.comments || [],
    };

    console.log('✅ [IssueActions] Enriched issue:', {
      id: enriched.id,
      statusLabel: enriched.statusLabel,
      daysAgo: enriched.daysAgo,
      citizen: enriched.citizen,
    });

    return enriched;
  }, [issue, statusMap]);

  const [acceptDialog, setAcceptDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [recordStepsDialog, setRecordStepsDialog] = useState(false);
  const [escalateDialog, setEscalateDialog] = useState(false);
  const [recordResolutionDialog, setRecordResolutionDialog] = useState(false);
  const [acceptedDialog, setAcceptedDialog] = useState(false);
  const [rejectedDialog, setRejectedDialog] = useState(false);
  const [escalatedDialog, setEscalatedDialog] = useState(false);
  const [disableEscalation, setDisableEscalation] = useState(false);
  const [rateAppealDialog, setRateAppealDialog] = useState(false);
  const [ratingDialog, setRatingDialog] = useState(false);
  const [recordedSteps, setRecordedSteps] = useState(false);
  const [recordedResolution, setRecordedResolution] = useState(false);
  const [currentDate, setCurrentDate] = useState(moment());
  const [citizenName, setCitizenName] = useState();
  const [reason, onChangeReason] = useState('');
  const [escalateComment, onChangeEscalateComment] = useState('');
  const [comment, onChangeComment] = useState('');
  const [resolution, onChangeResolution] = useState('');
  const [isAcceptEnabled, setIsAcceptEnabled] = useState(false);
  const [isRecordResolutionEnabled, setIsRecordResolutionEnabled] = useState(false);
  const [isRateAppealEnabled, setIsRateAppealEnabled] = useState(false);
  const [isIssueAssignedToMe, setIsIssueAssignedToMe] = useState(false);
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const goToDetails = () => navigation.jumpTo('IssueDetail');
  const goToHistory = () => {
    setRecordedSteps(false);
    _hideRecordStepsDialog();
    navigation.jumpTo('History');
  };
  const _showDialog = () => setAcceptDialog(true);
  const _showEscalateDialog = () => setEscalateDialog(true);
  const _showRecordStepsDialog = () => setRecordStepsDialog(true);
  const _hideRecordStepsDialog = () => setRecordStepsDialog(false);
  const _hideEscalateDialog = () => setEscalateDialog(false);
  const _showRecordResolutionDialog = () => setRecordResolutionDialog(true);
  const _hideRecordResolutionDialog = () => setRecordResolutionDialog(false);
  const _showRateAppealDialog = () => {
    _hideRatingDialog();
    setRateAppealDialog(true);
  };
  const _hideRateAppealDialog = () => setRateAppealDialog(false);
  const _showRatingDialog = () => setRatingDialog(true);
  const _hideRatingDialog = () => setRatingDialog(false);
  const _hideDialog = () => setAcceptDialog(false);
  const _showRejectDialog = () => {
    _hideDialog();
    setRejectDialog(true);
  };
  const _hideRejectDialog = () => setRejectDialog(false);

  const showToast = (message) => {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  };

  /**
   * Check if escalation is enabled for the current issue state
   * RULE: Escalate button enabled when:
   * 1. Record resolution buttons are enabled (open status + assigned)
   * 2. Issue has not been escalated yet
   * 3. Escalation is not disabled
   */
  const _isEscalateEnabled = () => {
    return isRecordResolutionEnabled && !enrichedIssue?.escalate_flag && !disableEscalation;
  };

  const updateActionButtons = () => {
    console.log('🔍 [IssueActions] updateActionButtons called with:', {
      enrichedIssue: enrichedIssue
        ? {
            id: enrichedIssue.id,
            status_id: enrichedIssue.status_id,
            escalate_flag: enrichedIssue.escalate_flag,
          }
        : null,
      isIssueAssignedToMe,
      statusesCount: statuses?.length || 0,
    });

    /**
     * Modern Action Button Rules - Consistent with Frappe backend expectations
     * Each function returns boolean indicating if the button should be enabled
     */

    function _isAcceptEnabled(statusItem) {
      const statusData = statusItem._raw || statusItem;
      const currentStatusId = enrichedIssue?.status_id || enrichedIssue?.status?.id;

      console.log('🔍 [IssueActions] _isAcceptEnabled check:', {
        statusId: statusData.id,
        statusName: statusData.status_name,
        initialStatus: statusData.initial_status,
        currentStatusId,
        isIssueAssignedToMe,
        matches: currentStatusId === statusData.id,
      });

      // RULE: Accept button enabled when:
      // 1. Issue is in initial status (newly submitted) AND current user is assigned to the issue AND current issue status matches this status
      const isInitialStatusMatch =
        statusData.initial_status === true &&
        isIssueAssignedToMe &&
        currentStatusId === statusData.id;

      return isInitialStatusMatch;
    }

    // Check if accept should be enabled for Unknown status issues
    const isUnknownStatusAndAssigned = () => {
      const currentStatusId = enrichedIssue?.status_id || enrichedIssue?.status?.id;
      const isUnknownStatus = !currentStatusId || currentStatusId === '';
      const result = isUnknownStatus && isIssueAssignedToMe;

      if (isUnknownStatus) {
        console.log('🔍 [IssueActions] Unknown status check:', {
          currentStatusId,
          isUnknownStatus,
          isIssueAssignedToMe,
          result,
        });
      }

      return result;
    };

    function _isRecordResolutionEnabled(statusItem) {
      const statusData = statusItem._raw || statusItem;
      const currentStatusId = enrichedIssue?.status_id || enrichedIssue?.status?.id;

      console.log('🔍 [IssueActions] _isRecordResolutionEnabled check:', {
        statusId: statusData.id,
        statusName: statusData.status_name,
        openStatus: statusData.open_status,
        currentStatusId,
        isIssueAssignedToMe,
        escalateFlag: enrichedIssue?.escalate_flag,
        matches: currentStatusId === statusData.id,
      });

      // RULE: Record resolution buttons enabled when:
      // 1. Issue is in open status (being worked on)
      // 2. Current user is assigned to the issue
      // 3. Issue has not been escalated
      // 4. Current issue status matches this status
      return (
        statusData.open_status === true &&
        isIssueAssignedToMe &&
        !enrichedIssue?.escalate_flag &&
        currentStatusId === statusData.id
      );
    }

    function _isRateAppealEnabled(statusItem) {
      const statusData = statusItem._raw || statusItem;
      const currentStatusId = enrichedIssue?.status_id || enrichedIssue?.status?.id;

      console.log('🔍 [IssueActions] _isRateAppealEnabled check:', {
        statusId: statusData.id,
        statusName: statusData.status_name,
        finalStatus: statusData.final_status,
        currentStatusId,
        isIssueAssignedToMe,
        matches: currentStatusId === statusData.id,
      });

      // RULE: Rate/Appeal button enabled when:
      // 1. Issue is in final status (resolved/closed)
      // 2. Current user is NOT assigned (citizen can rate)
      // 3. Current issue status matches this status
      return (
        statusData.final_status === true &&
        !isIssueAssignedToMe &&
        currentStatusId === statusData.id
      );
    }

    // Apply the rules to determine button states
    if (statuses && statuses.length > 0) {
      console.log('🔍 [IssueActions] Checking statuses for button enablement...');

      const acceptEnabled = statuses.some(_isAcceptEnabled) || isUnknownStatusAndAssigned();
      const recordResolutionEnabled = statuses.some(_isRecordResolutionEnabled);
      const rateAppealEnabled = statuses.some(_isRateAppealEnabled);

      console.log('🔍 [IssueActions] Button enablement results:', {
        acceptEnabled,
        recordResolutionEnabled,
        rateAppealEnabled,
        escalateEnabled: _isEscalateEnabled(),
      });

      setIsAcceptEnabled(acceptEnabled);
      setIsRecordResolutionEnabled(recordResolutionEnabled);
      setIsRateAppealEnabled(rateAppealEnabled);
    } else {
      console.warn('🔍 [IssueActions] No statuses available for button enablement');
      // Disable all buttons if no statuses available
      setIsAcceptEnabled(false);
      setIsRecordResolutionEnabled(false);
      setIsRateAppealEnabled(false);
    }
  };

  // ✅ FIXED: Add useEffect to call updateActionButtons when dependencies change
  useEffect(() => {
    console.log('🔍 [IssueActions] useEffect for updateActionButtons triggered');
    if (enrichedIssue && statuses && statuses.length > 0) {
      updateActionButtons();
    }
  }, [enrichedIssue, statuses, isIssueAssignedToMe]);

  useEffect(() => {
    if (!enrichedIssue || !userContext) return;

    function _isIssueAssignedToMe() {
      console.log('🔍 [IssueActions] _isIssueAssignedToMe check:', {
        enrichedIssue_assignee: enrichedIssue.assignee,
        enrichedIssue_assignee_id: enrichedIssue.assignee_id,
        enrichedIssue_reporter_id: enrichedIssue.reporter_id,
        currentUserId,
        hasAssignee: !!enrichedIssue.assignee?.id,
        assigneeId: enrichedIssue.assignee?.id,
        reporterEqualsAssignee: enrichedIssue.reporter?.id === enrichedIssue.assignee?.id,
        assigneeEqualsCurrentUser: enrichedIssue.assignee?.id === currentUserId,
      });

      if (enrichedIssue.assignee && enrichedIssue.assignee.id) {
        const result =
          enrichedIssue.reporter.id === enrichedIssue.assignee.id ||
          enrichedIssue.assignee.id === currentUserId;
        console.log('🔍 [IssueActions] _isIssueAssignedToMe result:', result);
        return result;
      }

      console.log('🔍 [IssueActions] _isIssueAssignedToMe: No assignee, returning false');
      return false;
    }

    const isAssigned = _isIssueAssignedToMe();
    console.log('🔍 [IssueActions] Setting isIssueAssignedToMe to:', isAssigned);
    setIsIssueAssignedToMe(isAssigned);

    if (enrichedIssue.citizen_type !== 'Confidential') {
      setCitizenName(enrichedIssue.citizen);
    } else {
      setCitizenName(isAssigned ? enrichedIssue.citizen : 'Anonymous');
    }

    if (enrichedIssue.rating) {
      setRating(enrichedIssue.rating);
    }
  }, [enrichedIssue, userContext, currentUserId]);

  const whatsApp = () => {
    Linking.openURL(WHATSAPP_LINK + enrichedIssue?.contact_information?.contact)
      .then((value) => {
        console.log('whatsapp result: ', value);
      })
      .catch((reason1) => {
        console.error('Oups! An error occurred', reason1);
      });
  };

  const phoneCall = () => {
    Linking.openURL(PHONE_CALL_LINK + enrichedIssue?.contact_information?.contact)
      .then((value) => {
        console.log('phone_call result: ', value);
      })
      .catch((reason1) => {
        console.error('phone_call: Oups! An error occurred', reason1);
      });
  };

  /**
   * Modern Issue Status Update Function - Offline First with WatermelonDB
   * Updates WatermelonDB directly, which then syncs to Frappe automatically
   */
  const saveIssueStatus = async (newStatus, actionType = 'none', additionalData = {}) => {
    setIsUpdating(true);

    try {
      const db = watermelonManager.getDatabase();

      await db.write(async () => {
        // Get the current issue record
        const issueRecord = await db.get('grm_issues').find(enrichedIssue.id);

        // Update the issue record using WatermelonDB writer
        await issueRecord.update((issue) => {
          // Handle status change using proper field assignment
          if (newStatus) {
            const statusId = newStatus.id || newStatus._raw?.id;
            // ✅ FIXED: Use _setRaw method for relation fields in WatermelonDB
            // This is the correct way to set foreign key fields
            issue._setRaw('status_id', statusId);
            console.log('🔄 [IssueActions] Status change:', {
              from: enrichedIssue.status_id,
              to: statusId,
              actionType,
            });
          }

          // Handle specific action types with proper field updates
          const now = new Date();

          switch (actionType) {
            case 'accept':
              // ✅ FIXED: Use _setRaw method for assignee relation field
              issue._setRaw('assignee_id', currentUserId);
              issue.acceptedDate = now;
              break;

            case 'reject':
              issue.rejectReason = reason;
              issue.rejectedDate = now;
              // ✅ FIXED: Use _setRaw method for rejectedBy relation field
              issue._setRaw('rejected_by', currentUserId);
              break;

            case 'record_resolution':
              issue.resolutionText = resolution;
              issue.resolutionDate = now;
              // ✅ FIXED: Use _setRaw method for resolvedBy relation field
              issue._setRaw('resolved_by', currentUserId);
              break;

            case 'escalate':
              issue.escalateFlag = true;
              issue.escalatedDate = now;
              // ✅ FIXED: Use _setRaw method for escalatedBy relation field
              issue._setRaw('escalated_by', currentUserId);
              issue.escalationReason = escalateComment;
              break;

            case 'record_steps':
              // For record steps, we don't update the main issue but will create a log entry
              break;

            case 'rate':
              issue.rating = rating;
              issue.ratedDate = now;
              break;

            case 'appeal':
              issue.appealSubmitted = true;
              issue.appealDate = now;
              break;
          }

          // Add any additional data passed to the function
          Object.keys(additionalData).forEach((key) => {
            if (additionalData[key] !== undefined && issue[key] !== undefined) {
              issue[key] = additionalData[key];
            }
          });

          // Update timestamp
          issue.updatedAt = now;
        });

        // ✅ VALIDATION: Verify the status was actually updated
        if (newStatus) {
          const updatedIssue = await db.get('grm_issues').find(enrichedIssue.id);
          const expectedStatusId = newStatus.id || newStatus._raw?.id;

          if (updatedIssue._raw.status_id !== expectedStatusId) {
            throw new Error(
              `Status update failed: expected ${expectedStatusId}, got ${updatedIssue._raw.status_id}`
            );
          }

          console.log('✅ [IssueActions] Status update verified in database:', {
            issueId: enrichedIssue.id,
            newStatusId: updatedIssue._raw.status_id,
            actionType,
          });
        }

        // Create comment entry if action type is specified
        if (actionType !== 'none') {
          let commentText;

          // For actions with user input, include the actual details in comments
          switch (actionType) {
            case 'record_steps':
              // For record_steps, use pure user input as comment
              commentText = comment;
              console.log('🔍 [IssueActions] record_steps comment:', { comment, commentText });
              break;

            case 'reject':
              // For reject, include the actual rejection reason
              commentText = reason;
              console.log('🔍 [IssueActions] reject comment:', { reason, commentText });
              break;

            case 'escalate':
              // For escalate, include the actual escalation reason
              commentText = escalateComment;
              console.log('🔍 [IssueActions] escalate comment:', { escalateComment, commentText });
              break;

            case 'record_resolution':
              // For record_resolution, include the actual resolution details
              commentText = resolution;
              console.log('🔍 [IssueActions] record_resolution comment:', {
                resolution,
                commentText,
              });
              break;

            case 'rate':
              // For rate, include the actual rating value
              commentText = `Rating: ${rating}/5`;
              console.log('🔍 [IssueActions] rate comment:', { rating, commentText });
              break;

            default:
              // For other actions, use templated messages
              const commentMap = {
                accept: t('issue_was_accepted_by_user', { user: currentUserId }),
                appeal: t('appeal_submitted_by_citizen'),
              };
              commentText = commentMap[actionType] || t('status_updated');
              console.log('🔍 [IssueActions] default comment:', { actionType, commentText });
              break;
          }

          // Create comment record in WatermelonDB
          await db.get('grm_issue_comments').create((commentRecord) => {
            // ✅ FIXED: Use _setRaw method for relation fields
            commentRecord._setRaw('grm_issue_id', enrichedIssue.id);
            commentRecord._setRaw('user_id', currentUserId);
            commentRecord.comment = commentText;
            commentRecord.activityType = actionType; // Add activity type for proper classification
            commentRecord.createdAt = new Date();
            commentRecord.updatedAt = new Date();
          });

          // Create log entry for audit trail
          await db.get('grm_issue_logs').create((logRecord) => {
            // ✅ FIXED: Use _setRaw method for relation fields
            logRecord._setRaw('grm_issue_id', enrichedIssue.id);
            logRecord._setRaw('user_id', currentUserId);

            // ✅ FIXED: Set proper actionTaken (past tense) and text based on action type
            switch (actionType) {
              case 'accept':
                logRecord.actionTaken = t('accepted_issue') || 'Accepted issue';
                logRecord.text =
                  t('issue_accepted_explanation') ||
                  'Issue has been accepted and assigned for processing';
                break;

              case 'reject':
                logRecord.actionTaken = t('rejected_issue') || 'Rejected issue';
                logRecord.text = reason; // Use actual rejection reason as text
                break;

              case 'record_steps':
                logRecord.actionTaken = t('added_steps') || 'Added steps';
                logRecord.text = comment; // Use actual user input as text
                logRecord.actionTakenDate = new Date();
                logRecord._setRaw('action_taken_by', currentUserId);
                break;

              case 'record_resolution':
                logRecord.actionTaken = t('resolved_issue') || 'Resolved issue';
                logRecord.text = resolution; // Use actual resolution details as text
                break;

              case 'escalate':
                logRecord.actionTaken = t('escalated_issue') || 'Escalated issue';
                logRecord.text = escalateComment; // Use actual escalation reason as text
                break;

              case 'rate':
                logRecord.actionTaken = t('rated_issue') || 'Rated issue';
                logRecord.text = `Rating: ${rating}/5`; // Use actual rating as text
                break;

              case 'appeal':
                logRecord.actionTaken = t('submitted_appeal') || 'Submitted appeal';
                logRecord.text =
                  t('appeal_submitted_explanation') || 'Appeal has been submitted for review';
                break;

              default:
                logRecord.actionTaken = t('updated_status') || 'Updated status';
                logRecord.text = t('status_updated_explanation') || 'Issue status has been updated';
                break;
            }

            logRecord.timestamp = new Date();
            logRecord.createdAt = new Date();
            logRecord.updatedAt = new Date();
          });
        }
      });

      console.log('✅ [IssueActions] Issue updated successfully in WatermelonDB');

      // Update local UI state (enrichedIssue is used for immediate UI feedback)
      if (newStatus) {
        const statusData = newStatus._raw || newStatus;
        enrichedIssue.status_id = statusData.id;
        enrichedIssue.status = {
          id: statusData.id,
          name: statusData.status_name || statusData.name,
        };
        enrichedIssue.statusLabel = statusData.status_name || statusData.name;
      }

      // Update other fields in local state based on action
      switch (actionType) {
        case 'accept':
          enrichedIssue.assignee_id = currentUserId;
          break;
        case 'reject':
          enrichedIssue.reject_reason = reason;
          break;
        case 'record_resolution':
          enrichedIssue.resolution_text = resolution;
          break;
        case 'escalate':
          enrichedIssue.escalate_flag = true;
          break;
        case 'rate':
          enrichedIssue.rating = rating;
          break;
      }

      // Refresh action buttons based on new state
      updateActionButtons();

      // Handle UI state updates for each action type
      const handleUIStateUpdate = (actionType) => {
        switch (actionType) {
          case 'accept':
            setAcceptedDialog(true);
            _hideDialog();
            break;
          case 'reject':
            setRejectedDialog(true);
            _hideRejectDialog();
            break;
          case 'record_resolution':
            setRecordedResolution(false);
            _hideRecordResolutionDialog();
            break;
          case 'escalate':
            setDisableEscalation(true);
            setEscalatedDialog(true);
            _hideEscalateDialog();
            break;
          case 'record_steps':
            setRecordedSteps(true);
            _hideRecordStepsDialog();
            break;
          case 'rate':
            if (rating === 0) {
              _showRateAppealDialog();
            } else {
              _hideRatingDialog();
            }
            break;
          case 'appeal':
            _hideRateAppealDialog();
            break;
        }
      };

      handleUIStateUpdate(actionType);
    } catch (error) {
      console.error('❌ [IssueActions] Error updating issue status:', error);
      console.error('❌ [IssueActions] Error details:', {
        issueId: enrichedIssue?.id,
        actionType,
        newStatusId: newStatus?.id || newStatus?._raw?.id,
        errorMessage: error.message,
        errorStack: error.stack,
      });

      // Show user-friendly error message
      showToast(
        t('error_updating_issue_status') || 'Error updating issue status. Please try again.'
      );

      // Reset updating state
      setIsUpdating(false);
      return;
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Modern Action Functions - Each action uses standardized status finding and processing
   */
  const acceptIssue = async () => {
    // Find the "In Progress" status (open_status = true means open for activities/accepted)
    const newStatus = statuses.find((status) => {
      const statusData = status._raw || status;
      return statusData.open_status === true;
    });

    if (!newStatus) {
      console.error('❌ [IssueActions] No open status found for accept action');
      showToast(t('error_no_open_status_found'));
      return;
    }

    await saveIssueStatus(newStatus, 'accept');
  };

  const rejectIssue = async () => {
    if (!reason || reason.trim() === '') {
      showToast(t('please_provide_rejection_reason'));
      return;
    }

    const newStatus = statuses.find((status) => {
      const statusData = status._raw || status;
      return statusData.rejected_status === true;
    });

    if (!newStatus) {
      console.error('❌ [IssueActions] No rejected status found for reject action');
      showToast(t('error_no_rejected_status_found'));
      return;
    }

    await saveIssueStatus(newStatus, 'reject');
  };

  const rateIssue = async () => {
    if (rating === 0) {
      showToast(t('please_select_rating'));
      return;
    }

    // Rating doesn't change status, just adds rating data
    await saveIssueStatus(null, 'rate');
  };

  const appealIssue = async () => {
    const newStatus = statuses.find((status) => {
      const statusData = status._raw || status;
      return statusData.open_status === true;
    });

    if (!newStatus) {
      console.error('❌ [IssueActions] No open status found for appeal action');
      showToast(t('error_no_open_status_found'));
      return;
    }

    await saveIssueStatus(newStatus, 'appeal');
  };

  const escalateIssue = async () => {
    if (!escalateComment || escalateComment.trim() === '') {
      showToast(t('please_provide_escalation_reason'));
      return;
    }

    // Escalation doesn't change status immediately, just sets escalation flag
    await saveIssueStatus(null, 'escalate');
  };

  const recordStep = async () => {
    if (!comment || comment.trim() === '') {
      showToast(t('please_provide_steps_taken'));
      return;
    }

    // Recording steps doesn't change status, just adds action log
    await saveIssueStatus(null, 'record_steps');
  };

  const recordResolution = () => {
    setRecordedResolution(true);
  };

  const recordResolutionConfirmation = async () => {
    if (!resolution || resolution.trim() === '') {
      showToast(t('please_provide_resolution_details'));
      return;
    }

    console.log('🔍 [IssueActions] recordResolutionConfirmation called with:', {
      resolution,
      resolutionLength: resolution?.length,
      resolutionTrimmed: resolution?.trim(),
    });

    const newStatus = statuses.find((status) => {
      const statusData = status._raw || status;
      return statusData.final_status === true;
    });

    if (!newStatus) {
      console.error('❌ [IssueActions] No final status found for resolution action');
      showToast(t('error_no_final_status_found'));
      return;
    }

    console.log('🔍 [IssueActions] About to call saveIssueStatus with:', {
      newStatus: newStatus._raw || newStatus,
      actionType: 'record_resolution',
      resolution,
    });

    await saveIssueStatus(newStatus, 'record_resolution');
  };

  if (!enrichedIssue) {
    return (
      <View style={{ padding: 23, alignItems: 'center' }}>
        <Text>{t('loading_issue_data')}</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : null}>
        <View style={{ padding: 23 }}>
          <Text style={styles.stepDescription}>
            {citizenName}, {enrichedIssue.intakeDateFormatted} {enrichedIssue.daysAgo}{' '}
            {t('days_ago')}
          </Text>
          <Text style={styles.stepDescription}>
            {t('status_label')}:{' '}
            <Text
              style={{
                color:
                  enrichedIssue.status?.id === 1 || enrichedIssue.status?.id === 2
                    ? colors.inProgress
                    : colors.primary,
              }}
            >
              {enrichedIssue.statusLabel}
            </Text>
          </Text>
          <Text style={styles.stepNote}>{enrichedIssue.description?.substring(0, 170)}</Text>
          <View style={styles.optionButtonContainer}>
            <Button
              theme={theme}
              style={{ alignSelf: 'center', margin: 24 }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={goToDetails}
            >
              {t('view_details')}
            </Button>

            {/* THROUGH THOSE BUTTONS YOU CAN MAKE A WHATSAPP CALL, PHONE CALL AND SEND EMAIL TO THE COMPLAINER */}
            {enrichedIssue.contact_information &&
              enrichedIssue.contact_information.contact !== '*' && (
                <>
                  {enrichedIssue.contact_information.type === 'phone' ? (
                    <IconButton
                      icon="phone"
                      color={colors.primary}
                      size={35}
                      onPress={() => phoneCall()}
                    />
                  ) : enrichedIssue.contact_information.type === 'whatsapp' ? (
                    <IconButton
                      icon="whatsapp"
                      color={colors.primary}
                      size={35}
                      onPress={() => whatsApp()}
                    />
                  ) : (
                    <></>
                  )}
                </>
              )}
          </View>

          <View style={styles.ratingInfoSection}>
            {!enrichedIssue.rating ? (
              <Text style={styles.radioLabel}>{t('not_rate_yet')}</Text>
            ) : (
              <Text style={styles.radioLabel}>
                {t(`satisfaction_level_${enrichedIssue.rating}`)}
              </Text>
            )}
            <StarRating
              starSize={30}
              rating={() => (enrichedIssue.rating ? enrichedIssue.rating : 0)}
              maxStars={5}
              onChange={() => null}
              emptyColor="#dddddd"
            />
          </View>

          {/* ACTION BUTTONS */}
          <View
            style={{ borderWidth: 1, borderRadius: 15, padding: 15, borderColor: colors.lightgray }}
          >
            <TouchableOpacity
              onPress={() => _showDialog()}
              disabled={!isAcceptEnabled}
              style={{
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginVertical: 10,
              }}
            >
              <Text style={styles.subtitle}>{t('accept_issue')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AntDesign
                  style={{ marginRight: 5 }}
                  name="rightsquare"
                  size={35}
                  color={isAcceptEnabled ? colors.primary : colors.disabled}
                />
                <Feather name="help-circle" size={24} color="gray" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={_showRecordStepsDialog}
              disabled={!isRecordResolutionEnabled}
              style={{
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginVertical: 10,
              }}
            >
              <Text style={styles.subtitle}>{t('record_steps_taken').substring(0, 28)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AntDesign
                  style={{ marginRight: 5 }}
                  name="rightsquare"
                  size={35}
                  color={isRecordResolutionEnabled ? colors.primary : colors.disabled}
                />
                <Feather name="help-circle" size={24} color="gray" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={_showRecordResolutionDialog}
              disabled={!isRecordResolutionEnabled}
              style={{
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginVertical: 10,
              }}
            >
              <Text style={styles.subtitle}>{t('record_resolution')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AntDesign
                  style={{ marginRight: 5 }}
                  name="rightsquare"
                  size={35}
                  color={isRecordResolutionEnabled ? colors.primary : colors.disabled}
                />
                <Feather name="help-circle" size={24} color="gray" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={_showRatingDialog}
              disabled={!isRateAppealEnabled}
              style={{
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginVertical: 10,
              }}
            >
              <Text style={styles.subtitle}>{t('rate_appeal')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AntDesign
                  style={{ marginRight: 5 }}
                  name="rightsquare"
                  size={35}
                  color={isRateAppealEnabled ? colors.primary : colors.disabled}
                />
                <Feather name="help-circle" size={24} color="gray" />
              </View>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={_showEscalateDialog}
            disabled={!_isEscalateEnabled()}
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginVertical: 10,
              padding: 15,
            }}
          >
            <Text style={styles.subtitle}>{t('escalate')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AntDesign
                style={{ marginRight: 5 }}
                name="rightsquare"
                size={35}
                color={_isEscalateEnabled() ? colors.primary : colors.disabled}
              />
              <Feather name="help-circle" size={24} color="gray" />
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* FEEDBACK AND APPEAL MODAL */}
      <Portal>
        <Dialog visible={rateAppealDialog} onDismiss={_hideRateAppealDialog}>
          <Dialog.Title>{t('confirmation')}?</Dialog.Title>
          <Dialog.Content>
            <Paragraph>{t('confirm_your_choice')}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              theme={theme}
              style={{
                alignSelf: 'center',
                backgroundColor: '#E74C3C',
                paddingLeft: 15,
                paddingRight: 15,
              }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={_hideRateAppealDialog}
            >
              {t('no')}
            </Button>
            <Button
              theme={theme}
              style={{ alignSelf: 'center', margin: 24, paddingLeft: 15, paddingRight: 15 }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={appealIssue}
            >
              {t('yes')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* RATING MODAL */}
      <Portal>
        <Dialog visible={ratingDialog} onDismiss={_hideRatingDialog}>
          <Dialog.Title>{t('rating')}?</Dialog.Title>
          <Dialog.Content>
            <Paragraph>{t('rate_issue')}</Paragraph>
            <RadioButton.Group
              onValueChange={(newValue) => {
                if (newValue === rating) {
                  setRating(0);
                } else {
                  setRating(newValue);
                }
              }}
              value={rating}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
                <RadioButton.Android value={5} uncheckedColor="#dedede" color={colors.primary} />
                <Text style={styles.radioLabel}>{t('satisfaction_level_5')} </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
                <RadioButton.Android value={4} uncheckedColor="#dedede" color={colors.primary} />
                <Text style={styles.radioLabel}>{t('satisfaction_level_4')} </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
                <RadioButton.Android value={3} uncheckedColor="#dedede" color={colors.primary} />
                <Text style={styles.radioLabel}>{t('satisfaction_level_3')} </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
                <RadioButton.Android value={2} uncheckedColor="#dedede" color={colors.primary} />
                <Text style={styles.radioLabel}>{t('satisfaction_level_2')} </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
                <RadioButton.Android value={1} uncheckedColor="#dedede" color={colors.primary} />
                <Text style={styles.radioLabel}>{t('satisfaction_level_1')} </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
                <RadioButton.Android value={0} uncheckedColor="#dedede" color={colors.primary} />
                <Text style={styles.radioLabel}>{t('satisfaction_level_0')} </Text>
              </View>
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              theme={theme}
              style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={_hideRatingDialog}
            >
              {t('cancel')}
            </Button>
            <Button
              theme={theme}
              style={{ alignSelf: 'center', margin: 24 }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={rateIssue}
            >
              {t('save_button_text')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* REJECT MODAL */}
      <Portal>
        <Dialog visible={rejectDialog} onDismiss={_hideRejectDialog}>
          <Dialog.Content>
            {!rejectedDialog ? (
              <Paragraph>{t('you_are_rejecting')}</Paragraph>
            ) : (
              <Paragraph>{t('complaint_rejected')}</Paragraph>
            )}
            {!rejectedDialog && (
              <TextInput
                multiline
                style={{ marginTop: 10 }}
                mode="outlined"
                theme={theme}
                onChangeText={onChangeReason}
              />
            )}
          </Dialog.Content>
          {!rejectedDialog ? (
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={_hideRejectDialog}
              >
                {t('cancel')}
              </Button>
              <Button
                disabled={reason === ''}
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={rejectIssue}
              >
                {t('submit')}
              </Button>
            </Dialog.Actions>
          ) : (
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={_hideRejectDialog}
              >
                {t('finished')}
              </Button>
            </Dialog.Actions>
          )}
        </Dialog>
      </Portal>

      {/* ACCEPT MODAL */}
      <Portal>
        <Dialog visible={acceptDialog} onDismiss={_hideDialog}>
          {!acceptedDialog && <Dialog.Title>{t('accept_issue')}?</Dialog.Title>}
          <Dialog.Content>
            {!acceptedDialog ? (
              <Paragraph>{t('are_you_accepting')}</Paragraph>
            ) : (
              <Paragraph>{t('you_have_accepted')}</Paragraph>
            )}
          </Dialog.Content>
          {!acceptedDialog ? (
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={_showRejectDialog}
              >
                {t('reject')}
              </Button>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={acceptIssue}
              >
                {t('accept')}
              </Button>
            </Dialog.Actions>
          ) : (
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={_hideDialog}
              >
                {t('finished')}
              </Button>
            </Dialog.Actions>
          )}
        </Dialog>
      </Portal>

      {/* ESCALATE MODAL */}
      <Portal>
        <Dialog visible={escalateDialog} onDismiss={_hideEscalateDialog}>
          <Dialog.Content>
            {!escalatedDialog ? (
              <Paragraph>{t('you_are_escalating')}</Paragraph>
            ) : (
              <Paragraph>{t('escalated_text')}</Paragraph>
            )}
            {!escalatedDialog && (
              <TextInput
                multiline
                style={{ marginTop: 10 }}
                mode="outlined"
                theme={theme}
                onChangeText={onChangeEscalateComment}
              />
            )}
          </Dialog.Content>
          {!escalatedDialog ? (
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={_hideEscalateDialog}
              >
                {t('cancel')}
              </Button>
              <Button
                disabled={escalateComment === ''}
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={escalateIssue}
              >
                {t('submit')}
              </Button>
            </Dialog.Actions>
          ) : (
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={() => {
                  _hideEscalateDialog();
                  setEscalatedDialog(false);
                }}
              >
                {t('finished')}
              </Button>
            </Dialog.Actions>
          )}
        </Dialog>
      </Portal>

      {/* RECORD STEPS MODAL */}
      <Portal>
        <Dialog visible={recordStepsDialog} onDismiss={_hideRecordStepsDialog}>
          <Dialog.Content>
            {!recordedSteps ? (
              <Paragraph>{t('record_steps_text')}</Paragraph>
            ) : (
              <Paragraph>{t('recorded_comment')}</Paragraph>
            )}
            {!recordedSteps && (
              <TextInput
                multiline
                style={{ marginTop: 10 }}
                mode="outlined"
                theme={theme}
                onChangeText={onChangeComment}
              />
            )}
          </Dialog.Content>
          {!recordedSteps ? (
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={_hideRecordStepsDialog}
              >
                {t('cancel')}
              </Button>
              <Button
                disabled={comment === ''}
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={recordStep}
              >
                {t('submit')}
              </Button>
            </Dialog.Actions>
          ) : (
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={() => {
                  _hideRecordStepsDialog();
                  setRecordedSteps(false);
                }}
              >
                {t('finished')}
              </Button>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={goToHistory}
              >
                {t('view_history')}
              </Button>
            </Dialog.Actions>
          )}
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={recordResolutionDialog} onDismiss={_hideRecordResolutionDialog}>
          <Dialog.Content>
            {!recordedResolution ? (
              <Paragraph>{t('summarize_resolution')}</Paragraph>
            ) : (
              <Paragraph>{t('please_confirm_resolution')}</Paragraph>
            )}
            {!recordedResolution ? (
              <TextInput
                multiline
                style={{ marginTop: 10 }}
                mode="outlined"
                theme={theme}
                onChangeText={onChangeResolution}
              />
            ) : (
              <Text>
                {'\n'}"{resolution}"
              </Text>
            )}
          </Dialog.Content>
          {!recordedResolution ? (
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={_hideRecordResolutionDialog}
              >
                {t('cancel')}
              </Button>
              <Button
                disabled={resolution === ''}
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={recordResolution}
              >
                {t('submit')}
              </Button>
            </Dialog.Actions>
          ) : (
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={() => setRecordedResolution(false)}
              >
                {t('cancel')}
              </Button>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={recordResolutionConfirmation}
              >
                {t('confirm')}
              </Button>
            </Dialog.Actions>
          )}
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

export default Content;

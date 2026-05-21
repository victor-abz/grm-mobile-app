import React, { useState, useEffect } from 'react';
import { showToast } from '../../../../utils/utils';

import moment from 'moment';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Button, IconButton, Paragraph } from 'react-native-paper';
import { ContactMethod, Issue } from '../../../../models/issues/Issue';
import { IssueStatus } from '../../../../models/issues/IssueStatus';
import { i18n } from '../../../../translations/i18n';
import { colors } from '../../../../utils/colors';
import { compareIdsEquivalence } from '../../../../utils/utils';
import AcceptDialog from '../components/AcceptDialog';
import ActionButton from '../components/ActionButton';
import AppealDialog from '../components/AppealDialog';
import EscalateDialog from '../components/EscalateDialog';
import RatingDialog from '../components/RatingDialog';
import RecordResolutionDialog from '../components/RecordResolutionDialog';
import RecordStepsDialog from '../components/RecordStepsDialog';
import RejectDialog from '../components/RejectDialog';
import { styles } from './Content.styles';
import { ConfidentialityChoices } from '../../../../utils/constants';
import { IssueComment } from '../../../../models/issues/IssueComment';
import { useIssueComments } from '../../../../hooks/issues/useIssueComments';
import { setNewCommentsFlag } from '../../../../store/ducks/global.duck';
import { useDispatch } from 'react-redux';

type ConfirmationDialogType =
  | 'record_steps'
  | 'appeal'
  | 'rating'
  | 'accept'
  | 'reject'
  | 'escalate'
  | 'record_resolution'
  | null;
  

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

type Props = {
  currentIssue: any;
  navigation: any;
  session: any;
  profile: any;
  loading: boolean;
  statuses: IssueStatus[];
  updateIssue: (issue: Issue) => Promise<Issue>;
  getStatus: (statusName: keyof IssueStatus) => IssueStatus;
};

function Content({ session, profile, currentIssue, navigation, loading, statuses = [], updateIssue, getStatus }: Props) {
  const [issue, setIssue] = useState(currentIssue);
  const { createIssueComment } = useIssueComments(issue.id, true);

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
  const [citizenName, setCitizenName] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [escalateComment, onChangeEscalateComment] = useState('');
  const [comment, setComment] = useState('');


  const [resolution, onChangeResolution] = useState('');
  const [isAcceptEnabled, setIsAcceptEnabled] = useState(false);
  const [isRecordResolutionEnabled, setIsRecordResolutionEnabled] = useState(false);
  const [isRateAppealEnabled, setIsRateAppealEnabled] = useState(false);
  const [isIssueAssignedToMe, setIsIssueAssignedToMe] = useState(false);
  const [rating, setRating] = useState(5);
  const [hasActionsOrResolved, setHasActionsOrResolved] = useState(false);
  const [attachment, setAttachment] = useState({});
  const [recordingURI, setRecordingURI] = useState();
  const dispatch = useDispatch()

  const goToDetails = () => navigation.jumpTo('IssueDetail');
  const goToHistory = () => {
    setRecordedSteps(false);
    _hideRecordStepsDialog();
    navigation.setParams({ item: issue });
    navigation.navigate('History');
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
  const _hideRatingDialog = () => setRatingDialog(false);
  const _hideDialog = () => setAcceptDialog(false);
  const _showRejectDialog = () => {
    _hideDialog();
    setRejectDialog(true);
  };
  const _hideRejectDialog = () => setRejectDialog(false);

  const updateActionButtons = () => {
    function _isAcceptEnabled(x) {
      
      if (x.initial_status && isIssueAssignedToMe) {
        return compareIdsEquivalence(issue.status?.id, x.id);
      }
    }

    function _isRecordResolutionEnabled(x) {
      
      if (x.open_status && isIssueAssignedToMe) {
        return compareIdsEquivalence(issue.status?.id, x.id) && !issue.escalate_flag;
      }
    }

    function _isRateAppealEnabled(x) {
      if (x.final_status && !isIssueAssignedToMe) {
        return compareIdsEquivalence(issue.status?.id, x.id);
      }
    }

    if (statuses) {
      setIsAcceptEnabled(statuses.some(_isAcceptEnabled));
      setIsRecordResolutionEnabled(statuses.some(_isRecordResolutionEnabled));
      setIsRateAppealEnabled(statuses.some(_isRateAppealEnabled));
    }

    // check if can reject
    const hasComments = issue.comments && issue.comments.length > 0;
    const hasEscalated = issue.escalate_flag;
    const isIssueResolved = statuses.length > 0 && isIssueStatusEqualTo('final_status', issue);
    const hasRejected = statuses.length > 0 && isIssueStatusEqualTo('rejected_status', issue);

    setHasActionsOrResolved(hasComments || hasEscalated || hasRejected || isIssueResolved);
  };

  const whatsApp = () => {
    Linking.openURL(WHATSAPP_LINK + issue.contact_information)
      .then((value) => {
        console.log('whatsapp result: ', value);
      })
      .catch((reason1) => {
        console.error('Oups! An error occurred', reason1);
      });
  };

  const phoneCall = () => {
    Linking.openURL(PHONE_CALL_LINK + issue.contact_information)
      .then((value) => {
        console.log('phone_call result: ', value);
      })
      .catch((reason1) => {
        console.error('phone_call: Oups! An error occurred', reason1);
      });
  };

  const updateIssueWithComments = async (issue, newStatus, commentData) => {
    const newComments = [...(issue.comments ?? []), commentData];

    return {
      ...issue,
      status: newStatus,
      // TODO: Use new comment services to add
      // the following commented property
      // comments: newComments,
    };
  };

  const addActionCommentToHistory = async (text?: string) => {
    if (!text && comment.length < 1) {
      return;
    }
    const newComment: IssueComment = {
      id: undefined,
      parent_id: issue.id,
      user: { id: session.user_id, name: profile?.user?.name },
      comment: text ?? comment,
      due_date: new Date().toISOString(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };
    await createIssueComment(newComment);
    setComment('');
    dispatch(setNewCommentsFlag(true))
  };

  const acceptIssue = async () => {
    try {
      setComment(i18n.t('issue_was_accepted'));
      const newStatus = getStatus('open_status');
      setIssue((prevIssue) => {
        const updatedIssue = {
          ...prevIssue,
          status: newStatus,
        };

        return updatedIssue;
      });
    } catch (error) {
      alert(error);
    }
  };

  const rejectIssue = () => {
    try {
      setComment(`${i18n.t('issue_was_rejected')}: ${rejectReason}`);
      const newStatus = getStatus('rejected_status');
      if (!newStatus) {
        console.error('No rejected status found');
        showToast(i18n.t('error_rejecting_issue'));
        return;
      }
      setIssue((prevIssue) => {
        const updatedIssue = {
          ...prevIssue,
          status: newStatus,
          reject_flag: true,
          reject_reason: rejectReason
         
        };
        return updatedIssue;
      });
    } catch (error) {
      alert(error);
    }
  };

  const rateIssue = () => {
    if (rating > 0) {
      setIssue((prevIssue) => {
        const updatedIssue = updateIssueWithComments(prevIssue, prevIssue.status, {
          name: prevIssue.reporter.name,
          id: session?.user_id,
          comment: i18n.t('issue_was_rated'),
          due_date: moment(),
        });
        updatedIssue.rating = rating;
        return updatedIssue;
      });
    } else {
      _showRateAppealDialog();
    }
    _hideRatingDialog();
  };

  const appealIssue = () => {
    const newStatus = getStatus('open_status');
    setIssue((prevIssue) => {
      const updatedIssue = updateIssueWithComments(prevIssue, newStatus, {
        name: prevIssue.reporter.name,
        id: session?.user_id,
        comment: i18n.t('issue_was_appealed'),
        due_date: moment(),
      });
      updatedIssue.escalate_flag = true;
      return updatedIssue;
    });
    _hideRateAppealDialog();
    showToast('Votre demande a bien été prise en compte.');
  };

  const escalateIssue = () => {
    try {
      setComment(`${i18n.t('issue_was_escalated')}: ${escalateComment}`);
      setIssue((prevIssue) => {
        const updatedIssue = {
          ...prevIssue,
          escalate_flag: true,
          escalation_reason: escalateComment,
        };
        return updatedIssue;
      });
    } catch (error) {
      alert(error);
    }
  };

  const recordStep = async () => {
    try {
      setIssue((prevIssue) => {
        const updatedIssue = {
          ...prevIssue,
          updated_date: new Date(),
        };
        return updatedIssue;
      });
    } catch (error) {
      alert(error);
    }
  };

  useEffect(() => {
    // Determine which dialog confirmation type is active
    const onSaveIssueStatusAndComment = async () => {
      let confirmationDialogType: ConfirmationDialogType = null;

      if (recordResolutionDialog) {
        confirmationDialogType = 'record_resolution';
      } else if (acceptDialog) {
        confirmationDialogType = 'accept';
      } else if (recordStepsDialog) {
        confirmationDialogType = 'record_steps';
      } else if (escalateDialog) {
        confirmationDialogType = 'escalate';
      } else if (rejectDialog) {
        confirmationDialogType = 'reject';
      } else if (rateAppealDialog) {
        confirmationDialogType = 'appeal';
      } else if (ratingDialog) {
        confirmationDialogType = 'rating';
      }

      if (
        rateAppealDialog ||
        acceptDialog ||
        recordStepsDialog ||
        recordResolutionDialog ||
        escalateDialog ||
        rejectDialog ||
        ratingDialog
      ) {
        try {
          await saveIssueStatus(confirmationDialogType);
        } catch (error) {
          alert(error);
          return;
        }
        try {
          // skip for those which are not creating comments
          await addActionCommentToHistory();
        } catch (error) {
          alert(error);
        }
      }
    };

     onSaveIssueStatusAndComment()
    
  }, [issue]);

  const recordResolution = () => {
    setRecordedResolution(true);
  };

  const recordResolutionConfirmation = () => {
    const newStatus = getStatus('final_status');
    try {
      setComment(`${i18n.t('issue_was_resolved')}: ${resolution}`);
      setIssue((prevIssue) => {
        const updatedIssue = {
          ...prevIssue,
          research_result: resolution,
          status: newStatus,
        };
        return updatedIssue;
      });
    } catch (error) {
      alert(error);
    }
  };

  const saveIssueStatus = async (
    dialogConfirmationType?: ConfirmationDialogType
  ) => {
    try {
      await updateIssue(issue);
      updateActionButtons();
      handleConfirmationDialogs(dialogConfirmationType);
    } catch (error) {
      throw new Error(`Save issue error: ${error}`);
    }
  };

  useEffect(() => {
    if (loading) return;
    const reporterId = issue.reporter?.id ?? issue.reporter;
    const isAssigned =
      issue.assignee?.id &&
      (reporterId === issue.assignee.id || issue.assignee.id === session?.user_id);
    setIsIssueAssignedToMe(isAssigned);

    if (issue.citizen) {
      if (issue.citizen.type !== ConfidentialityChoices.CONFIDENTIAL) {
        setCitizenName(issue.citizen.name ?? '');
      } else {
        setCitizenName(isAssigned ? (issue.citizen.name ?? '') : 'Anonymous');
      }
    } else {
      setCitizenName('');
    }

    if (issue.rating) {
      setRating(issue.rating);
    }
    updateActionButtons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  return (
    <ScrollView>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : null}>
        {renderHeaderAndActions(
          citizenName,
          issue,
          currentDate,
          goToDetails,
          phoneCall,
          whatsApp,
          _showDialog,
          isAcceptEnabled,
          isIssueAssignedToMe,
          _showRejectDialog,
          rejectedDialog,
          hasActionsOrResolved,
          _showRecordStepsDialog,
          isRecordResolutionEnabled,
          _showRecordResolutionDialog,
          _showEscalateDialog,
          disableEscalation
        )}
      </KeyboardAvoidingView>

      {/* DIALOGS */}
      <AppealDialog
        visible={rateAppealDialog}
        onDismiss={_hideRateAppealDialog}
        onSubmit={appealIssue}
      />
      <RatingDialog
        visible={ratingDialog}
        rating={rating}
        setRating={setRating}
        onDismiss={_hideRatingDialog}
        onSubmit={rateIssue}
      />
      <RejectDialog
        visible={rejectDialog}
        rejectedDialog={rejectedDialog}
        reason={rejectReason}
        onChangeReason={setRejectReason}
        attachment={attachment}
        setAttachment={setAttachment}
        setRecordingURI={setRecordingURI}
        onDismiss={_hideRejectDialog}
        onSubmit={rejectIssue}
      />
      <AcceptDialog
        visible={acceptDialog}
        acceptedDialogVisible={acceptedDialog}
        _showRejectDialog={_showRejectDialog}
        onSubmit={acceptIssue}
        onDismiss={_hideDialog}
      />
      <EscalateDialog
        visible={escalateDialog}
        escalatedDialog={escalatedDialog}
        onChangeEscalateComment={onChangeEscalateComment}
        setAttachment={setAttachment}
        setRecordingURI={setRecordingURI}
        escalateComment={escalateComment}
        setEscalatedDialog={setEscalatedDialog}
        onSubmit={escalateIssue}
        onDismiss={_hideEscalateDialog}
      />
      <RecordStepsDialog
        visible={recordStepsDialog}
        recordedSteps={recordedSteps}
        onChangeComment={setComment}
        setAttachment={setAttachment}
        setRecordingURI={setRecordingURI}
        comment={comment}
        setRecordedSteps={setRecordedSteps}
        onSubmit={recordStep}
        onDismiss={_hideRecordStepsDialog}
      />
      <RecordResolutionDialog
        visible={recordResolutionDialog}
        recordedResolution={recordedResolution}
        onChangeResolution={onChangeResolution}
        resolution={resolution}
        setAttachment={setAttachment}
        setRecordingURI={setRecordingURI}
        recordResolution={recordResolution}
        setRecordedResolution={setRecordedResolution}
        onSubmit={recordResolutionConfirmation}
        onDismiss={_hideRecordResolutionDialog}
      />
    </ScrollView>
  );

  function isIssueStatusEqualTo(targetStatus: keyof IssueStatus, issue: Issue) {
    const status = getStatus(targetStatus)
    return compareIdsEquivalence(issue.status?.id, status.id);
  }

  function handleConfirmationDialogs(dialogConfirmationType?: ConfirmationDialogType) {
    if (dialogConfirmationType === 'accept') {
      setAcceptedDialog(true);
    } else if (dialogConfirmationType === 'reject') {
      setRejectedDialog(true);
      setDisableEscalation(true);
      setIsAcceptEnabled(false);
      setIsRecordResolutionEnabled(false);
      setIsRateAppealEnabled(false);
      showToast(i18n.t('issue_rejected_successfully'));
    } else if (dialogConfirmationType === 'escalate') {
      setDisableEscalation(true);
      setEscalatedDialog(true);
      setHasActionsOrResolved(true);
    } else if (dialogConfirmationType === 'record_resolution') {
      setRecordedResolution(false);
      _hideRecordResolutionDialog();
      setHasActionsOrResolved(true);
    } else if (dialogConfirmationType === 'record_steps') {
      setRecordedSteps(true);
      setHasActionsOrResolved(true);
    }
  }
}


function renderHeaderAndActions(
  citizenName: string,
  issue: any,
  currentDate: moment.Moment,
  goToDetails: () => any,
  phoneCall: () => void,
  whatsApp: () => void,
  _showDialog: () => void,
  isAcceptEnabled: boolean,
  isIssueAssignedToMe: boolean,
  _showRejectDialog: () => void,
  rejectedDialog: boolean,
  hasActionsOrResolved: boolean,
  _showRecordStepsDialog: () => void,
  isRecordResolutionEnabled: boolean,
  _showRecordResolutionDialog: () => void,
  _showEscalateDialog: () => void,
  disableEscalation: boolean
) {
  return (
    <View style={{ padding: 23 }}>
      <Text style={styles.stepDescription}>
        {citizenName ? `${citizenName}, ` : null}
        {i18n.translate('created_at')}:{' '}
        {issue.created_date && moment(issue.created_date).format('DD-MMM-YYYY')}
        {' | '}
        {issue.created_date && currentDate.diff(issue.created_date, 'days')} {i18n.t('days_ago')}
      </Text>
      <Text style={styles.stepDescription}>
        {i18n.translate('updated_at')}
        {': '}
        {issue.updated_date && moment(issue.updated_date).format('DD-MMM-YYYY')}
        {' | '}
        {issue.updated_date && currentDate.diff(issue.updated_date, 'days')} {i18n.t('days_ago')}
      </Text>
      <Text style={styles.stepDescription}>
        {i18n.t('status_label')}:{' '}
        <Text
          style={{
            color:
              issue.status?.id === 1 || issue.status?.id === 2 ? colors.inProgress : colors.primary,
          }}
        >
          {issue.status?.name}
        </Text>
      </Text>
      <Text style={styles.stepNote}>{issue.description?.substring(0, 170)}</Text>
      <View style={styles.optionButtonContainer}>
        <Button
          theme={theme}
          style={{ alignSelf: 'center', margin: 24 }}
          labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
          mode="contained"
          onPress={goToDetails}
        >
          {i18n.t('view_details')}
        </Button>

        {/* THROUGH THOSE BUTTONS OYU CAN MAKE A WHATSAPP CALL, PHONE CALL AND SEND EMAIL TO THE COMPLAINER */}
        {issue.contact_information && issue.contact_information !== '*' && (
          <>
            {issue.contact_method === ContactMethod.PHONE_NUMBER ? (
              <IconButton
                icon="phone"
                color={colors.primary}
                size={35}
                onPress={() => phoneCall()}
              />
            ) : issue.contact_method === ContactMethod.WHATSAPP ? (
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
      {/* ACTION BUTTONS */}
      <View
        style={{ borderWidth: 1, borderRadius: 15, padding: 15, borderColor: colors.lightgray }}
      >
        {/* Actions */}
        <ActionButton
          label={i18n.t('accept_issue')}
          tooltipLabel={i18n.t('accept_issue_help_description')}
          onShowDialog={_showDialog}
          isEnabled={isAcceptEnabled && isIssueAssignedToMe}
        />
        <ActionButton
          label={i18n.t('reject_issue')}
          tooltipLabel={i18n.t('reject_issue_help_description')}
          onShowDialog={_showRejectDialog}
          isEnabled={(!hasActionsOrResolved || isAcceptEnabled) && isIssueAssignedToMe}
        />
        <ActionButton
          label={i18n.t('record_steps_taken')}
          tooltipLabel={i18n.t('record_steps_taken_help_description')}
          onShowDialog={_showRecordStepsDialog}
          isEnabled={isRecordResolutionEnabled}
        />
        <ActionButton
          label={i18n.t('record_resolution')}
          tooltipLabel={i18n.t('record_resolution_help_description')}
          onShowDialog={_showRecordResolutionDialog}
          isEnabled={isRecordResolutionEnabled && isIssueAssignedToMe}
        />
      </View>
      <ActionButton
        label={i18n.t('escalate')}
        tooltipLabel={i18n.t('escalate_help_description')}
        onShowDialog={_showEscalateDialog}
        isEnabled={!disableEscalation && isRecordResolutionEnabled}
      />
    </View>
  );
}
export default Content;

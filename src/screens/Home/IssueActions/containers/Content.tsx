import React, { useState, useEffect } from 'react';

//TODO:

// [x] connect updateIssue with remote,
// [x] rename dialog params,
// [x] Add missing fields to local issue schema
// [x] Test local correct saving, 
// [x] verify search list being updated
// [x] verify patch with id as string created by watermelon
// [x] check new way of saving statuses within a PATCH, just an id
// [ ] test sync after re-connection
// [ ] sub type will be changed to global
// [ ] reporter can edit - rating
// [ ] assignee can edit - status - check Policy
// reporter rating , appeal, comentar
// assignee acceptar, rechazar, cerrar, comentar.
// todo editar de los

// campos de fecha vacio no los toma en getCurrentPositionAsync, formato incorrecto da error

// assignee status, reporter Rating. 

// import { withObservables } from '@nozbe/watermelondb/react';

import moment from 'moment';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Text,
  ToastAndroid,
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
  loading: boolean;
  statuses: IssueStatus[];
  updateIssue: (issue: Issue) => Promise<Issue>;
  getStatus: (statusName: keyof IssueStatus) => IssueStatus;
};

function Content({ session, currentIssue, navigation, loading, statuses = [], updateIssue, getStatus }: Props) {
  const [issue, setIssue] = useState(currentIssue);
  
  // const [issue, setIssue] = useState({
  //   ...currentIssue,
  //   // status: { name: 'Créé', id: 1 }
  //   status: { name: 'Ouv', id: 4 },
  //   reject_flag: true,
  //   assignee: { id: 2 },
  //   reporter: { id: 2 },
  //   // status: { name: 'Ouv', id: 2 }
  // });
  
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
  const [reason, onChangeReason] = useState('');
  const [escalateComment, onChangeEscalateComment] = useState('');
  const [comment, onChangeComment] = useState('');

  const [resolution, onChangeResolution] = useState('');
  const [isAcceptEnabled, setIsAcceptEnabled] = useState(false);
  const [isRecordResolutionEnabled, setIsRecordResolutionEnabled] = useState(false);
  const [isRateAppealEnabled, setIsRateAppealEnabled] = useState(false);
  const [isIssueAssignedToMe, setIsIssueAssignedToMe] = useState(false);
  const [rating, setRating] = useState(0);
  const [hasActionsOrResolved, setHasActionsOrResolved] = useState(false);
  const [attachment, setAttachment] = useState({});
  const [recordingURI, setRecordingURI] = useState();

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

  const showToast = (message) => {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  };

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

  const updateIssueWithComments = (issue, newStatus, commentData) => {
    const newComments = [...(issue.comments ?? []), commentData];

    return {
      ...issue,
      status: newStatus,
      // TODO: Use new comment services to add
      // the following commented property
      // comments: newComments,
    };
  };

  const acceptIssue = () => {
    const newStatus = getStatus('open_status');
    setIssue((prevIssue) => {
      const updatedIssue = updateIssueWithComments(prevIssue, newStatus, {
        name: prevIssue.reporter.name,
        id: prevIssue.assignee.id,
        comment: i18n.t('issue_was_accepted'),
        due_at: moment(),
      });
      return updatedIssue;
    });
  };

  const rejectIssue = () => {
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

        // TODO: Use new comment services to add
        // the following commented property
        // comments: [
        //   ...(prevIssue.comments ?? []),
        //   {
        //     name: prevIssue.reporter.name,
        //     id: session?.user_id,
        //     comment: reason,
        //     due_at: moment().toNow(),
        //     attachment: attachment.uri
        //       ? {
        //           url: '',
        //           id: attachment?.id,
        //           uploaded: false,
        //           local_url: attachment?.uri,
        //           name: attachment?.uri.split('/').pop(),
        //         }
        //       : undefined,
        //     recording: recordingURI
        //       ? {
        //           url: '',
        //           id: recordingURI.split('/').pop(),
        //           uploaded: false,
        //           local_url: recordingURI,
        //           isAudio: true,
        //           name: recordingURI.split('/').pop(),
        //         }
        //       : undefined,
        //   },
        // ],
      };
      return updatedIssue;
    });
  };

  const rateIssue = () => {
    if (rating > 0) {
      setIssue((prevIssue) => {
        const updatedIssue = updateIssueWithComments(prevIssue, prevIssue.status, {
          name: prevIssue.reporter.name,
          id: session?.user_id,
          comment: i18n.t('issue_was_rated'),
          due_at: moment(),
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
        due_at: moment(),
      });
      updatedIssue.escalate_flag = true;
      return updatedIssue;
    });
    _hideRateAppealDialog();
    showToast('Votre demande a bien été prise en compte.');
  };

  const escalateIssue = () => {
    setIssue((prevIssue) => {
      const updatedIssue = {
        ...prevIssue,
        escalate_flag: true,
        //leave it singular as a string
        escalation_reason: '',

        // TODO: Use new comment services to add
        // the following commented property
        // comments: [
        //   ...(prevIssue.comments || []),
        //   {
        //     //check if can be replaced with create response
        //     name: prevIssue.reporter.name,
        //     id: session?.user_id,
        //     comment: escalateComment,
        //     due_at: moment(),
        //     attachment: attachment.uri
        //       ? {
        //           url: '',
        //           id: attachment?.id,
        //           uploaded: false,
        //           local_url: attachment?.uri,
        //           name: attachment?.uri.split('/').pop(),
        //         }
        //       : undefined,
        //     recording: recordingURI
        //       ? {
        //           url: '',
        //           id: recordingURI.split('/').pop(),
        //           uploaded: false,
        //           local_url: recordingURI,
        //           isAudio: true,
        //           name: recordingURI.split('/').pop(),
        //         }
        //       : undefined,
        //   },
        // ],
      };
      console.log('escalate : ', updatedIssue.comments);
      return updatedIssue;
    });
  };

  const recordStep = () => {
    setIssue((prevIssue) => {
      const updatedIssue = updateIssueWithComments(prevIssue, issue.status, {
        name: prevIssue.reporter.name,
        id: session?.user_id,
        comment,
        due_at: moment(),
        attachment: attachment.uri
          ? {
              url: '',
              id: attachment?.id,
              uploaded: false,
              local_url: attachment?.uri,
              name: attachment?.uri.split('/').pop(),
            }
          : undefined,
        recording: recordingURI
          ? {
              url: '',
              id: recordingURI.split('/').pop(),
              uploaded: false,
              local_url: recordingURI,
              isAudio: true,
              name: recordingURI.split('/').pop(),
            }
          : undefined,
      });

      return updatedIssue;
    });
  };

  useEffect(() => {
    // Determine which dialog confirmation type is active
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
      saveIssueStatus(confirmationDialogType);
    }
    
  }, [issue]);

  const recordResolution = () => {
    setRecordedResolution(true);
  };

  const recordResolutionConfirmation = () => {
    const newStatus = getStatus('final_status');
    setIssue(async (prevIssue) => {
      const updatedIssue = {
        ...prevIssue,
        research_result: resolution,
        status: newStatus,
        // comments: [
        //   ...prevIssue.comments,
        //   {
        //     name: prevIssue.reporter.name,
        //     id: session?.user_id,
        //     comment: i18n.t('issue_was_resolved'),
        //     due_at: moment(),
        //     attachment: attachment.uri
        //       ? {
        //           url: '',
        //           id: attachment?.id,
        //           uploaded: false,
        //           local_url: attachment?.uri,
        //           name: attachment?.uri.split('/').pop(),
        //         }
        //       : undefined,
        //     recording: recordingURI
        //       ? {
        //           url: '',
        //           id: recordingURI.split('/').pop(),
        //           uploaded: false,
        //           local_url: recordingURI,
        //           isAudio: true,
        //           name: recordingURI.split('/').pop(),
        //         }
        //       : undefined,
        //   },
        // ],
      };
      return updatedIssue
    });
  };

  const saveIssueStatus = async (
    dialogConfirmationType?: ConfirmationDialogType
  ) => {
    try {
      await updateIssue(issue);
      updateActionButtons();
      handleConfirmationDialogs(dialogConfirmationType);
    } catch (error) {
      console.log('Save issue error', error);
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
        reason={reason}
        onChangeReason={onChangeReason}
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
        onChangeComment={onChangeComment}
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

  function handleConfirmationDialogs(dialogConfirmationType: string) {
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
        {citizenName ? `${citizenName}, `: null} {issue.intake_date && moment(issue.intake_date).format('DD-MMM-YYYY')}{' '}
        {issue.intake_date && currentDate.diff(issue.intake_date, 'days')} {i18n.t('days_ago')}
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
          onShowDialog={_showDialog}
          isEnabled={isAcceptEnabled && isIssueAssignedToMe}
        />
        <ActionButton
          label={i18n.t('reject_issue')}
          onShowDialog={_showRejectDialog}
          isEnabled={(!hasActionsOrResolved || isAcceptEnabled) && isIssueAssignedToMe}
        />
        <ActionButton
          label={i18n.t('record_steps_taken')}
          onShowDialog={_showRecordStepsDialog}
          isEnabled={isRecordResolutionEnabled}
        />
        <ActionButton
          label={i18n.t('record_resolution')}
          onShowDialog={_showRecordResolutionDialog}
          isEnabled={isRecordResolutionEnabled && isIssueAssignedToMe}
        />
      </View>
      <ActionButton
        label={i18n.t('escalate')}
        onShowDialog={_showEscalateDialog}
        isEnabled={!disableEscalation && isRecordResolutionEnabled}
      />
    </View>
  );
}
export default Content;

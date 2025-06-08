import { AntDesign, Feather } from '@expo/vector-icons';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
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
import { updateIssue, getIssueStatuses } from '../../../../utils/databaseManager';
import { styles } from './Content.styles';

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

function Content({ issue, navigation, statuses = [], eadl }) {
  const { t } = useTranslation();
  const { dataManager } = useData();
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

  const updateActionButtons = () => {
    function _isAcceptEnabled(x) {
      if (x.initial_status && isIssueAssignedToMe) {
        return issue.status?.id === x.id;
      }
    }

    function _isRecordResolutionEnabled(x) {
      if (x.open_status && isIssueAssignedToMe) {
        return issue.status?.id === x.id && !issue.escalate_flag;
      }
    }

    function _isRateAppealEnabled(x) {
      if (x.final_status && !isIssueAssignedToMe) {
        return issue.status?.id === x.id;
      }
    }
    if (statuses) {
      setIsAcceptEnabled(statuses.some(_isAcceptEnabled));
      setIsRecordResolutionEnabled(statuses.some(_isRecordResolutionEnabled));
      setIsRateAppealEnabled(statuses.some(_isRateAppealEnabled));
    }
  };

  const whatsApp = () => {
    Linking.openURL(WHATSAPP_LINK + issue.contact_information.contact)
      .then((value) => {
        console.log('whatsapp result: ', value);
      })
      .catch((reason1) => {
        console.error('Oups! An error occurred', reason1);
      });
  };

  const phoneCall = () => {
    Linking.openURL(PHONE_CALL_LINK + issue.contact_information.contact)
      .then((value) => {
        console.log('phone_call result: ', value);
      })
      .catch((reason1) => {
        console.error('phone_call: Oups! An error occurred', reason1);
      });
  };

  const saveIssueStatus = async (newStatus, type = 'none') => {
    setIsUpdating(true);

    try {
      const updateData = {};

      // Prepare update data based on action type
      if (newStatus) {
        updateData.status = newStatus.name || newStatus.id;
      }

      // Handle comments
      if (!issue.comments) {
        issue.comments = [];
      }

      const newComment = {
        comment_by: eadl?._id,
        comment_text: '',
        comment_date: moment().toISOString(),
      };

      switch (type) {
        case 'accept':
          newComment.comment_text = t('issue_was_accepted');
          break;
        case 'reject':
          newComment.comment_text = t('issue_was_rejected');
          updateData.reject_reason = reason;
          break;
        case 'record_resolution':
          newComment.comment_text = t('issue_was_resolved');
          updateData.research_result = resolution;
          updateData.resolution_date = moment().toISOString();
          break;
        default:
          if (comment) {
            newComment.comment_text = comment;
          }
      }

      // Add comment if there's one
      if (newComment.comment_text) {
        updateData.comments = [...(issue.comments || []), newComment];
      }

      // Handle escalation
      if (type === 'escalate') {
        updateData.escalate_flag = true;
        updateData.escalation_reasons = [
          ...(issue.escalation_reasons || []),
          {
            reason_by: eadl?._id,
            reason_text: escalateComment,
            reason_date: moment().toISOString(),
          },
        ];
      }

      // Handle rating
      if (rating > 0 && type === 'rate') {
        updateData.rating = rating;
      }

      // Update the issue using DataManager
      const updatedIssue = await updateIssue(issue._id, updateData);

      // Update local issue object for UI
      Object.assign(issue, updateData);
      if (newStatus) {
        issue.status = {
          id: newStatus.id || newStatus.name,
          name: newStatus.name,
        };
      }

      updateActionButtons();

      // Show appropriate dialog
      switch (type) {
        case 'accept':
          setAcceptedDialog(true);
          break;
        case 'reject':
          setRejectedDialog(true);
          break;
        case 'record_resolution':
          setRecordedResolution(false);
          _hideRecordResolutionDialog();
          break;
        case 'escalate':
          setDisableEscalation(true);
          setEscalatedDialog(true);
          break;
        case 'record_steps':
          setRecordedSteps(true);
          break;
        case 'rate':
          if (rating === 0) {
            _showRateAppealDialog();
          }
          _hideRatingDialog();
          break;
      }

      console.log('Issue updated successfully');
    } catch (error) {
      console.error('Error updating issue:', error);
      // Show error message to user
    } finally {
      setIsUpdating(false);
    }
  };

  const acceptIssue = async () => {
    const newStatus = statuses.find((x) => x.open_status === true);
    await saveIssueStatus(newStatus, 'accept');
  };

  const rejectIssue = async () => {
    const newStatus = statuses.find((x) => x.rejected_status === true);
    await saveIssueStatus(newStatus, 'reject');
  };

  const rateIssue = async () => {
    await saveIssueStatus(null, 'rate');
  };

  const appealIssue = async () => {
    const newStatus = statuses.find((x) => x.open_status === true);
    await saveIssueStatus(newStatus, 'appeal');
    _hideRateAppealDialog();
    showToast('Votre demande a bien été prise en compte.');
  };

  const escalateIssue = async () => {
    await saveIssueStatus(null, 'escalate');
  };

  const recordStep = async () => {
    await saveIssueStatus(null, 'record_steps');
  };

  const recordResolution = () => {
    setRecordedResolution(true);
  };

  const recordResolutionConfirmation = async () => {
    const newStatus = statuses.find((x) => x.final_status === true);
    await saveIssueStatus(newStatus, 'record_resolution');
    _hideRecordResolutionDialog();
  };

  useEffect(() => {
    function _isIssueAssignedToMe() {
      if (issue.assignee && issue.assignee.id) {
        return issue.reporter.id === issue.assignee.id || issue.assignee.id === eadl?._id;
      }
      return false;
    }

    setIsIssueAssignedToMe(_isIssueAssignedToMe());

    if (issue.citizen_type !== 1) {
      setCitizenName(issue.citizen);
    } else if (issue.citizen_type === 1) {
      setCitizenName(_isIssueAssignedToMe() ? issue.citizen : 'Anonymous');
    }

    if (issue.rating) {
      setRating(issue.rating);
    }
    updateActionButtons();
  });

  useEffect(() => {
    updateActionButtons();
  }, [statuses, issue]);

  return (
    <ScrollView>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : null}>
        <View style={{ padding: 23 }}>
          <Text style={styles.stepDescription}>
            {citizenName}, {issue.intake_date && moment(issue.intake_date).format('DD-MMM-YYYY')}{' '}
            {issue.intake_date && currentDate.diff(issue.intake_date, 'days')} {t('days_ago')}
          </Text>
          <Text style={styles.stepDescription}>
            {t('status_label')}:{' '}
            <Text
              style={{
                color:
                  issue.status?.id === 1 || issue.status?.id === 2
                    ? colors.inProgress
                    : colors.primary,
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
              {t('view_details')}
            </Button>

            {/* THROUGH THOSE BUTTONS OYU CAN MAKE A WHATSAPP CALL, PHONE CALL AND SEND EMAIL TO THE COMPLAINER */}
            {issue.contact_information && issue.contact_information.contact !== '*' && (
              <>
                {issue.contact_information.type === 'phone_number' ? (
                  <IconButton
                    icon="phone"
                    color={colors.primary}
                    size={35}
                    onPress={() => phoneCall()}
                  />
                ) : issue.contact_information.type === 'whatsapp' ? (
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
            {!issue.rating ? (
              <Text style={styles.radioLabel}>{t('not_rate_yet')}</Text>
            ) : (
              <Text style={styles.radioLabel}>{t(`satisfaction_level_${issue.rating}`)}</Text>
            )}
            <StarRating
              starSize={30}
              rating={() => (issue.rating ? issue.rating : 0)}
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
            disabled={disableEscalation || !isRecordResolutionEnabled || issue.escalate_flag}
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
                color={
                  !disableEscalation && isRecordResolutionEnabled ? colors.primary : colors.disabled
                }
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

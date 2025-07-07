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
import { useIssueActions } from '../../../../hooks/useIssueActions';
import { ACTION_TYPES, DIALOG_TYPES, DIALOG_STATES } from '../../../../utils/issueActionTypes';
import ActionButton from '../../../../components/ActionButton';
import ActionDialog from '../../../../components/ActionDialog';

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

  // State for forcing issue data refresh
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Debug logging for IssueActions
  console.log('🔍 [IssueActions] Processing issue data:', {
    isArray: Array.isArray(issue),
    issue: issue?._raw ? 'WatermelonDB Object' : 'Raw Object',
  });

  if (issue && issue._raw) {
    console.log('🔍 [IssueActions] Raw issue data:', {
      id: issue._raw.id,
      status: issue._raw.status,
      assignee: issue._raw.assignee,
      reporter: issue._raw.reporter,
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

  // Create lookup helper function (memoized to prevent recreation)
  const createLookupMap = useMemo(() => {
    return (items, labelField) => {
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
  }, []);

  // Create lookup maps for statuses (properly memoized with stable dependencies)
  const statusMap = useMemo(
    () => createLookupMap(statuses, 'status_name'),
    [statuses?.length, createLookupMap]
  );

  // Enrich issue data with lookup labels (properly memoized)
  const enrichedIssue = useMemo(() => {
    if (!issue) return null;

    const issueData = Array.isArray(issue) ? issue[0] : issue;
    if (!issueData) return null;

    const rawData = issueData._raw || issueData;

    const enriched = {
      ...rawData,

      // Add resolved labels
      statusLabel: statusMap.get(rawData.status) || rawData.status || 'Unknown',

      // Format dates
      issueDateFormatted: rawData.issue_date
        ? moment(rawData.issue_date).format('DD-MMM-YYYY HH:mm')
        : '',
      intakeDateFormatted: rawData.intake_date
        ? moment(rawData.intake_date).format('DD-MMM-YYYY HH:mm')
        : '',

      // Calculate days ago (memoized calculation)
      daysAgo: rawData.intake_date ? moment().diff(moment(rawData.intake_date), 'days') : 0,

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
  }, [
    issue,
    statusMap,
    // Only depend on issue properties that actually matter for the calculation
    issue?._raw?.id,
    issue?._raw?.status,
    issue?._raw?.assignee,
    issue?._raw?.issue_date,
    issue?._raw?.intake_date,
  ]);

  // ========== USE ISSUE ACTIONS HOOK ==========
  const {
    dialogs,
    formInputs,
    actionStates,
    buttonStates,
    citizenName,
    showDialog,
    hideDialog,
    updateDialogState,
    updateFormInput,
    executeAction,
    goToDetails,
    goToHistory,
    showToast,
  } = useIssueActions(enrichedIssue, statuses, currentUserId, navigation, t);

  // ========== REFRESH MECHANISM ==========
  useEffect(() => {
    // When an action completes (not updating anymore), trigger refresh
    if (!actionStates.isUpdating && actionStates.lastActionTimestamp > 0) {
      console.log('🔄 [IssueActions] Action completed, refreshing issue data');
      setRefreshTrigger((prev) => prev + 1);
    }
  }, [actionStates.isUpdating, actionStates.lastActionTimestamp]);

  // ========== LINKING FUNCTIONS ==========
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

  // ========== ACTION HANDLERS ==========
  const handleAccept = () => executeAction(ACTION_TYPES.ACCEPT);
  const handleReject = () => executeAction(ACTION_TYPES.REJECT);
  const handleRecordSteps = () => executeAction(ACTION_TYPES.RECORD_STEPS);
  const handleRecordResolution = () => executeAction(ACTION_TYPES.RECORD_RESOLUTION);
  const handleEscalate = () => executeAction(ACTION_TYPES.ESCALATE);
  const handleRate = () => executeAction(ACTION_TYPES.RATE);
  const handleAppeal = () => executeAction(ACTION_TYPES.APPEAL);

  // ========== DIALOG HANDLERS ==========
  const [recordedResolution, setRecordedResolution] = useState(false);

  const handleRecordResolutionConfirmation = () => {
    setRecordedResolution(true);
  };

  const handleRecordResolutionFinal = () => {
    setRecordedResolution(false);
    executeAction(ACTION_TYPES.RECORD_RESOLUTION);
  };

  // ========== RENDERING ==========
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

            {/* CONTACT BUTTONS */}
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
            <ActionButton
              title={t('accept_issue')}
              enabled={buttonStates.isAcceptEnabled}
              onPress={() => showDialog(DIALOG_TYPES.ACCEPT)}
            />

            <ActionButton
              title={t('record_steps_taken')}
              enabled={buttonStates.isRecordResolutionEnabled}
              onPress={() => showDialog(DIALOG_TYPES.RECORD_STEPS)}
            />

            <ActionButton
              title={t('record_resolution')}
              enabled={buttonStates.isRecordResolutionEnabled}
              onPress={() => showDialog(DIALOG_TYPES.RECORD_RESOLUTION)}
            />

            <ActionButton
              title={t('rate_appeal')}
              enabled={buttonStates.isRateAppealEnabled}
              onPress={() => showDialog(DIALOG_TYPES.RATING)}
            />
          </View>

          <ActionButton
            title={t('escalate')}
            enabled={buttonStates.isEscalateEnabled}
            onPress={() => showDialog(DIALOG_TYPES.ESCALATE)}
            style={{ padding: 15 }}
          />
        </View>
      </KeyboardAvoidingView>

      {/* ========== ACTION DIALOGS ========== */}

      {/* Accept Dialog */}
      <ActionDialog
        type={DIALOG_TYPES.ACCEPT}
        visible={dialogs[DIALOG_TYPES.ACCEPT].visible}
        state={dialogs[DIALOG_TYPES.ACCEPT].state}
        onDismiss={() => hideDialog(DIALOG_TYPES.ACCEPT)}
        onPrimaryAction={
          dialogs[DIALOG_TYPES.ACCEPT].state === DIALOG_STATES.SUCCESS
            ? () => hideDialog(DIALOG_TYPES.ACCEPT)
            : handleAccept
        }
        onSecondaryAction={
          dialogs[DIALOG_TYPES.ACCEPT].state === DIALOG_STATES.SUCCESS
            ? null
            : () => {
                hideDialog(DIALOG_TYPES.ACCEPT);
                showDialog(DIALOG_TYPES.REJECT);
              }
        }
        t={t}
      />

      {/* Reject Dialog */}
      <ActionDialog
        type={DIALOG_TYPES.REJECT}
        visible={dialogs[DIALOG_TYPES.REJECT].visible}
        state={dialogs[DIALOG_TYPES.REJECT].state}
        onDismiss={() => hideDialog(DIALOG_TYPES.REJECT)}
        onPrimaryAction={
          dialogs[DIALOG_TYPES.REJECT].state === DIALOG_STATES.SUCCESS
            ? () => hideDialog(DIALOG_TYPES.REJECT)
            : handleReject
        }
        onSecondaryAction={
          dialogs[DIALOG_TYPES.REJECT].state === DIALOG_STATES.SUCCESS
            ? null
            : () => hideDialog(DIALOG_TYPES.REJECT)
        }
        formInputs={formInputs}
        onInputChange={updateFormInput}
        t={t}
      />

      {/* Record Steps Dialog */}
      <ActionDialog
        type={DIALOG_TYPES.RECORD_STEPS}
        visible={dialogs[DIALOG_TYPES.RECORD_STEPS].visible}
        state={dialogs[DIALOG_TYPES.RECORD_STEPS].state}
        onDismiss={() => hideDialog(DIALOG_TYPES.RECORD_STEPS)}
        onPrimaryAction={
          dialogs[DIALOG_TYPES.RECORD_STEPS].state === DIALOG_STATES.SUCCESS
            ? () => hideDialog(DIALOG_TYPES.RECORD_STEPS)
            : handleRecordSteps
        }
        onSecondaryAction={
          dialogs[DIALOG_TYPES.RECORD_STEPS].state === DIALOG_STATES.SUCCESS
            ? goToHistory
            : () => hideDialog(DIALOG_TYPES.RECORD_STEPS)
        }
        formInputs={formInputs}
        onInputChange={updateFormInput}
        t={t}
      />

      {/* Record Resolution Dialog */}
      <ActionDialog
        type={DIALOG_TYPES.RECORD_RESOLUTION}
        visible={dialogs[DIALOG_TYPES.RECORD_RESOLUTION].visible}
        onDismiss={() => hideDialog(DIALOG_TYPES.RECORD_RESOLUTION)}
        onPrimaryAction={
          recordedResolution ? handleRecordResolutionFinal : handleRecordResolutionConfirmation
        }
        onSecondaryAction={
          recordedResolution
            ? () => setRecordedResolution(false)
            : () => hideDialog(DIALOG_TYPES.RECORD_RESOLUTION)
        }
        formInputs={formInputs}
        onInputChange={updateFormInput}
        extraProps={{ isConfirmation: recordedResolution }}
        t={t}
      />

      {/* Escalate Dialog */}
      <ActionDialog
        type={DIALOG_TYPES.ESCALATE}
        visible={dialogs[DIALOG_TYPES.ESCALATE].visible}
        state={dialogs[DIALOG_TYPES.ESCALATE].state}
        onDismiss={() => hideDialog(DIALOG_TYPES.ESCALATE)}
        onPrimaryAction={
          dialogs[DIALOG_TYPES.ESCALATE].state === DIALOG_STATES.SUCCESS
            ? () => hideDialog(DIALOG_TYPES.ESCALATE)
            : handleEscalate
        }
        onSecondaryAction={
          dialogs[DIALOG_TYPES.ESCALATE].state === DIALOG_STATES.SUCCESS
            ? null
            : () => hideDialog(DIALOG_TYPES.ESCALATE)
        }
        formInputs={formInputs}
        onInputChange={updateFormInput}
        t={t}
      />

      {/* Rating Dialog */}
      <ActionDialog
        type={DIALOG_TYPES.RATING}
        visible={dialogs[DIALOG_TYPES.RATING].visible}
        onDismiss={() => hideDialog(DIALOG_TYPES.RATING)}
        onPrimaryAction={handleRate}
        onSecondaryAction={() => hideDialog(DIALOG_TYPES.RATING)}
        formInputs={formInputs}
        onInputChange={updateFormInput}
        t={t}
      />

      {/* Rate Appeal Dialog */}
      <ActionDialog
        type={DIALOG_TYPES.RATE_APPEAL}
        visible={dialogs[DIALOG_TYPES.RATE_APPEAL].visible}
        onDismiss={() => hideDialog(DIALOG_TYPES.RATE_APPEAL)}
        onPrimaryAction={handleAppeal}
        onSecondaryAction={() => hideDialog(DIALOG_TYPES.RATE_APPEAL)}
        formInputs={formInputs}
        onInputChange={updateFormInput}
        t={t}
      />
    </ScrollView>
  );
}

export default Content;

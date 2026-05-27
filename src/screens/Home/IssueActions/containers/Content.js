import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Linking, Platform, ScrollView, Text, View } from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import StarRating from 'react-native-star-rating-widget';
import dayjs from '../../../../utils/dayjs';
import { colors } from '../../../../utils/colors';
import { logger } from '../../../../utils/logger';
import { styles } from './Content.styles';
import { useIssueActions } from '../../../../hooks/useIssueActions';
import { ACTION_TYPES, DIALOG_TYPES, DIALOG_STATES } from '../../../../utils/issueActionTypes';
import ActionButton from '../../../../components/ActionButton';
import ActionDialog from '../../../../components/ActionDialog';

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: colors.placeholder,
    text: '#707070',
  },
};

const WHATSAPP_LINK = 'http://api.whatsapp.com/send?phone=223';
const PHONE_CALL_LINK = 'tel://+223';

const Content = ({ issue, navigation, statuses = [], userContext }) => {
  const { t } = useTranslation();

  // Debug logging for IssueActions
  logger.debug('IssueActions: Processing issue data', {
    isArray: Array.isArray(issue),
    issueType: issue?._raw ? 'WatermelonDB Object' : 'Raw Object',
  });

  if (issue && issue._raw) {
    logger.debug('IssueActions: Raw issue data', {
      issueId: issue._raw.id,
      status: issue._raw.status,
      hasAssignee: !!issue._raw.assignee,
      hasReporter: !!issue._raw.reporter,
    });
  }

  logger.debug('IssueActions: User context', {
    hasUser: !!userContext?.user,
    hasPermissions: !!userContext?.permissions,
    hasAssignments: !!userContext?.assignments,
  });

  // Get current user ID from context
  const currentUserId =
    userContext?.user?.id || userContext?.user?.name || userContext?.user?.email;

  // Create lookup helper function (memoized to prevent recreation)
  const createLookupMap = useMemo(
    () => (items, labelField) => {
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
    },
    []
  );

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
      statusLabel: statusMap.get(rawData.status) || rawData.status,

      // Format dates
      issueDateFormatted: rawData.issue_date
        ? dayjs(rawData.issue_date).format('DD-MMM-YYYY HH:mm')
        : '',
      intakeDateFormatted: rawData.intake_date
        ? dayjs(rawData.intake_date).format('DD-MMM-YYYY HH:mm')
        : '',

      // Calculate days ago (memoized calculation)
      daysAgo: rawData.intake_date ? dayjs().diff(dayjs(rawData.intake_date), 'day') : 0,

      // Contact information handling
      contact_information: rawData.contact_information
        ? {
            contact: rawData.contact_information,
            type: rawData.contact_info_type,
          }
        : null,

      // Handle citizen data
      citizen: rawData.citizen || t('anonymous'),
      citizen_type: rawData.citizen_type,

      // Other fields
      description: rawData.description || '',
      rating: Number(rawData.rating) || 0,
      escalate_flag: rawData.escalate_flag || false,
      comments: rawData.comments || [],
    };

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
    buttonStates,
    citizenName,
    showDialog,
    hideDialog,
    updateFormInput,
    executeAction,
    goToDetails,
    goToHistory,
  } = useIssueActions(enrichedIssue, statuses, currentUserId, navigation, t);

  // ========== LINKING FUNCTIONS ==========
  const whatsApp = () => {
    Linking.openURL(WHATSAPP_LINK + (enrichedIssue?.contact_information?.contact || '')).catch(
      () => {}
    );
  };

  const phoneCall = () => {
    Linking.openURL(PHONE_CALL_LINK + (enrichedIssue?.contact_information?.contact || '')).catch(
      () => {}
    );
  };

  // ========== ACTION HANDLERS ==========
  const handleAccept = () => executeAction(ACTION_TYPES.ACCEPT);
  const handleReject = () => executeAction(ACTION_TYPES.REJECT);
  const handleRecordSteps = () => executeAction(ACTION_TYPES.RECORD_STEPS);
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
            {(() => {
              if (
                enrichedIssue.contact_information &&
                enrichedIssue.contact_information.contact !== '*'
              ) {
                if (enrichedIssue.contact_information.type === 'phone') {
                  return (
                    <IconButton
                      icon="phone"
                      iconColor={colors.primary}
                      size={35}
                      onPress={() => phoneCall()}
                    />
                  );
                }
                if (enrichedIssue.contact_information.type === 'whatsapp') {
                  return (
                    <IconButton
                      icon="whatsapp"
                      iconColor={colors.primary}
                      size={35}
                      onPress={() => whatsApp()}
                    />
                  );
                }
              }
              return null;
            })()}
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
              rating={enrichedIssue.rating}
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
};

export default Content;

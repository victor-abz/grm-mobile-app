/**
 * ActionDialog Component - Reusable dialog for issue actions
 * Eliminates repetitive Portal/Dialog JSX patterns
 * Provides consistent behavior and styling across action dialogs
 */

import React from 'react';
import { Text, View } from 'react-native';
import { Button, Dialog, Paragraph, Portal, RadioButton, TextInput } from 'react-native-paper';
import { colors } from '../utils/colors';
import { DIALOG_TYPES, DIALOG_STATES } from '../utils/issueActionTypes';

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: colors.placeholder,
    text: '#707070',
  },
};

const ActionDialog = ({
  type,
  visible,
  state = DIALOG_STATES.INITIAL,
  onDismiss,
  onPrimaryAction,
  onSecondaryAction,
  formInputs = {},
  onInputChange,
  t,
  extraProps = {},
}) => {
  // Dialog configuration based on type
  const getDialogConfig = () => {
    const configs = {
      [DIALOG_TYPES.ACCEPT]: {
        title: state === DIALOG_STATES.SUCCESS ? null : `${t('accept_issue')}?`,
        content: state === DIALOG_STATES.SUCCESS ? t('you_have_accepted') : t('are_you_accepting'),
        primaryText: state === DIALOG_STATES.SUCCESS ? t('finished') : t('accept'),
        secondaryText: state === DIALOG_STATES.SUCCESS ? null : t('reject'),
        showInput: false,
        inputType: null,
      },

      [DIALOG_TYPES.REJECT]: {
        title: null,
        content: state === DIALOG_STATES.SUCCESS ? t('complaint_rejected') : t('you_are_rejecting'),
        primaryText: state === DIALOG_STATES.SUCCESS ? t('finished') : t('submit'),
        secondaryText: state === DIALOG_STATES.SUCCESS ? null : t('cancel'),
        showInput: state !== DIALOG_STATES.SUCCESS,
        inputType: 'multiline',
        inputValue: formInputs.reason || '',
        inputField: 'reason',
        primaryDisabled: !formInputs.reason || formInputs.reason === '',
      },

      [DIALOG_TYPES.RECORD_STEPS]: {
        title: null,
        content: state === DIALOG_STATES.SUCCESS ? t('recorded_comment') : t('record_steps_text'),
        primaryText: state === DIALOG_STATES.SUCCESS ? t('finished') : t('submit'),
        secondaryText: state === DIALOG_STATES.SUCCESS ? t('view_history') : t('cancel'),
        showInput: state !== DIALOG_STATES.SUCCESS,
        inputType: 'multiline',
        inputValue: formInputs.comment || '',
        inputField: 'comment',
        primaryDisabled: !formInputs.comment || formInputs.comment === '',
      },

      [DIALOG_TYPES.RECORD_RESOLUTION]: {
        title: null,
        content: extraProps.isConfirmation
          ? t('please_confirm_resolution')
          : t('summarize_resolution'),
        primaryText: extraProps.isConfirmation ? t('confirm') : t('submit'),
        secondaryText: t('cancel'),
        showInput: !extraProps.isConfirmation,
        showConfirmation: extraProps.isConfirmation,
        confirmationText: formInputs.resolution,
        inputType: 'multiline',
        inputValue: formInputs.resolution || '',
        inputField: 'resolution',
        primaryDisabled: !formInputs.resolution || formInputs.resolution === '',
      },

      [DIALOG_TYPES.ESCALATE]: {
        title: null,
        content: state === DIALOG_STATES.SUCCESS ? t('escalated_text') : t('you_are_escalating'),
        primaryText: state === DIALOG_STATES.SUCCESS ? t('finished') : t('submit'),
        secondaryText: state === DIALOG_STATES.SUCCESS ? null : t('cancel'),
        showInput: state !== DIALOG_STATES.SUCCESS,
        inputType: 'multiline',
        inputValue: formInputs.escalateComment || '',
        inputField: 'escalateComment',
        primaryDisabled: !formInputs.escalateComment || formInputs.escalateComment === '',
      },

      [DIALOG_TYPES.RATING]: {
        title: `${t('rating')}?`,
        content: t('rate_issue'),
        primaryText: t('save_button_text'),
        secondaryText: t('cancel'),
        showInput: false,
        showRating: true,
        ratingValue: formInputs.rating || 0,
      },

      [DIALOG_TYPES.RATE_APPEAL]: {
        title: `${t('confirmation')}?`,
        content: t('confirm_your_choice'),
        primaryText: t('yes'),
        secondaryText: t('no'),
        showInput: true,
        inputType: 'multiline',
        inputValue: formInputs.reason || '',
        inputField: 'reason',
        inputPlaceholder:
          t('appeal_reason_placeholder') || 'Please provide reason for appeal (optional)',
        primaryStyle: { backgroundColor: colors.primary },
        secondaryStyle: { backgroundColor: '#E74C3C' },
      },
    };

    return configs[type] || {};
  };

  const config = getDialogConfig();

  const renderInput = () => {
    if (!config.showInput) return null;

    return (
      <TextInput
        multiline={config.inputType === 'multiline'}
        style={{ marginTop: 10 }}
        mode="outlined"
        theme={theme}
        value={config.inputValue}
        onChangeText={(text) => onInputChange(config.inputField, text)}
        placeholder={config.inputPlaceholder}
      />
    );
  };

  const renderConfirmation = () => {
    if (!config.showConfirmation) return null;

    return (
      <Text style={{ marginTop: 10 }}>
        {'\n'}&quot;{config.confirmationText}&quot;
      </Text>
    );
  };

  const renderRating = () => {
    if (!config.showRating) return null;

    const ratingOptions = [
      { value: 5, label: t('satisfaction_level_5') },
      { value: 4, label: t('satisfaction_level_4') },
      { value: 3, label: t('satisfaction_level_3') },
      { value: 2, label: t('satisfaction_level_2') },
      { value: 1, label: t('satisfaction_level_1') },
      { value: 0, label: t('satisfaction_level_0') },
    ];

    return (
      <RadioButton.Group
        onValueChange={(newValue) => {
          const value = newValue === config.ratingValue ? 0 : newValue;
          onInputChange('rating', value);
        }}
        value={config.ratingValue}
      >
        {ratingOptions.map((option) => (
          <View
            key={option.value}
            style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}
          >
            <RadioButton.Android
              value={option.value}
              uncheckedColor="#dedede"
              color={colors.primary}
            />
            <Text style={{ fontSize: 16, color: '#707070' }}>{option.label}</Text>
          </View>
        ))}
      </RadioButton.Group>
    );
  };

  const renderActions = () => {
    const actions = [];

    // Secondary action (cancel/reject/etc)
    if (config.secondaryText) {
      actions.push(
        <Button
          key="secondary"
          theme={theme}
          style={[
            {
              alignSelf: 'center',
              backgroundColor: config.secondaryStyle?.backgroundColor || '#d4d4d4',
              paddingLeft: 15,
              paddingRight: 15,
            },
            config.secondaryStyle,
          ]}
          labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
          mode="contained"
          onPress={onSecondaryAction}
        >
          {config.secondaryText}
        </Button>
      );
    }

    // Primary action
    if (config.primaryText) {
      actions.push(
        <Button
          key="primary"
          disabled={config.primaryDisabled}
          theme={theme}
          style={[
            {
              alignSelf: 'center',
              margin: 24,
              paddingLeft: 15,
              paddingRight: 15,
            },
            config.primaryStyle,
          ]}
          labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
          mode="contained"
          onPress={onPrimaryAction}
        >
          {config.primaryText}
        </Button>
      );
    }

    return actions;
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        {config.title && <Dialog.Title>{config.title}</Dialog.Title>}
        <Dialog.Content>
          <Paragraph>{config.content}</Paragraph>
          {renderInput()}
          {renderConfirmation()}
          {renderRating()}
        </Dialog.Content>
        <Dialog.Actions>{renderActions()}</Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default ActionDialog;

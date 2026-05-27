/* eslint-disable no-use-before-define */
import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { RadioButton, TextInput } from 'react-native-paper';
import { colors } from '../utils/colors';
import { DIALOG_TYPES, DIALOG_STATES } from '../utils/issueActionTypes';

const inputTheme = {
  roundness: 10,
  colors: {
    primary: colors.primary,
    background: '#f8f9fa',
    placeholder: colors.placeholder,
    text: '#333',
    outline: '#e0e0e0',
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
  const getDialogConfig = () => {
    const configs = {
      [DIALOG_TYPES.ACCEPT]: {
        title: state === DIALOG_STATES.SUCCESS ? t('accept_issue') : `${t('accept_issue')}?`,
        content: state === DIALOG_STATES.SUCCESS ? t('you_have_accepted') : t('are_you_accepting'),
        primaryText: state === DIALOG_STATES.SUCCESS ? t('finished') : t('accept'),
        secondaryText: state === DIALOG_STATES.SUCCESS ? null : t('reject'),
        showInput: false,
        icon: state === DIALOG_STATES.SUCCESS ? 'check-circle' : 'help-circle',
      },
      [DIALOG_TYPES.REJECT]: {
        title: t('reject') || 'Reject',
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
        title: t('record_steps_taken') || 'Record Steps',
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
        title: t('record_resolution') || 'Record Resolution',
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
        title: t('escalate') || 'Escalate',
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
        title: t('rating') || 'Rating',
        content: t('rate_issue'),
        primaryText: t('save_button_text'),
        secondaryText: t('cancel'),
        showInput: false,
        showRating: true,
        ratingValue: formInputs.rating || 0,
      },
      [DIALOG_TYPES.RATE_APPEAL]: {
        title: t('confirmation') || 'Confirmation',
        content: t('confirm_your_choice'),
        primaryText: t('yes'),
        secondaryText: t('no'),
        showInput: true,
        inputType: 'multiline',
        inputValue: formInputs.reason || '',
        inputField: 'reason',
        inputPlaceholder:
          t('appeal_reason_placeholder') || 'Please provide reason for appeal (optional)',
        isDestructiveSecondary: true,
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
        numberOfLines={3}
        style={styles.textInput}
        mode="outlined"
        theme={inputTheme}
        value={config.inputValue}
        onChangeText={(text) => onInputChange(config.inputField, text)}
        placeholder={config.inputPlaceholder}
        outlineStyle={styles.inputOutline}
      />
    );
  };

  const renderConfirmation = () => {
    if (!config.showConfirmation) return null;
    return (
      <View style={styles.confirmationBox}>
        <Text style={styles.confirmationText}>&quot;{config.confirmationText}&quot;</Text>
      </View>
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
          <TouchableOpacity
            key={option.value}
            style={styles.ratingRow}
            onPress={() => {
              const value = option.value === config.ratingValue ? 0 : option.value;
              onInputChange('rating', value);
            }}
            activeOpacity={0.7}
          >
            <RadioButton.Android
              value={option.value}
              uncheckedColor="#dedede"
              color={colors.primary}
            />
            <Text style={styles.ratingLabel}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </RadioButton.Group>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {config.title && (
                <View style={styles.header}>
                  <Text style={styles.title}>{config.title}</Text>
                </View>
              )}

              <View style={styles.body}>
                <Text style={styles.content}>{config.content}</Text>
                {renderInput()}
                {renderConfirmation()}
                {renderRating()}
              </View>

              <View style={styles.footer}>
                {config.secondaryText && (
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.secondaryButton,
                      config.isDestructiveSecondary && styles.destructiveButton,
                    ]}
                    onPress={onSecondaryAction}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        styles.secondaryButtonText,
                        config.isDestructiveSecondary && styles.destructiveButtonText,
                      ]}
                    >
                      {config.secondaryText}
                    </Text>
                  </TouchableOpacity>
                )}
                {config.primaryText && (
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.primaryButton,
                      config.primaryDisabled && styles.disabledButton,
                    ]}
                    onPress={onPrimaryAction}
                    disabled={config.primaryDisabled}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        styles.primaryButtonText,
                        config.primaryDisabled && styles.disabledButtonText,
                      ]}
                    >
                      {config.primaryText}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1a1a1a',
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555',
    fontFamily: 'Poppins_400Regular',
  },
  textInput: {
    marginTop: 16,
    backgroundColor: '#f8f9fa',
    fontSize: 14,
    minHeight: 80,
  },
  inputOutline: {
    borderRadius: 12,
    borderColor: '#e0e0e0',
  },
  confirmationBox: {
    marginTop: 16,
    backgroundColor: '#f0faf6',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  confirmationText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    fontStyle: 'italic',
    fontFamily: 'Poppins_400Regular',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  ratingLabel: {
    fontSize: 15,
    color: '#555',
    fontFamily: 'Poppins_400Regular',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
  },
  destructiveButton: {
    backgroundColor: '#fef2f2',
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
  },
  primaryButtonText: {
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#666',
  },
  destructiveButtonText: {
    color: '#dc2626',
  },
  disabledButtonText: {
    color: '#999',
  },
});

export default ActionDialog;

import { useNavigation } from '@react-navigation/native';
import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { ActivityIndicator, Button, RadioButton, TextInput } from 'react-native-paper';
import { withObservables } from '@nozbe/watermelondb/react';
import CustomDropDownPicker from '../../../../components/CustomDropDownPicker/CustomDropDownPicker';
import watermelonManager from '../../../../database/watermelonManager';
import { colors } from '../../../../utils/colors';
import { styles } from './Content.styles';
import {
  processAgeGroups,
  processCitizenGroupsByType,
  createNavigationData,
} from '../../../../utils/citizenReportUtils';

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: colors.placeholder,
    text: '#707070',
  },
};

function Content({ stepOneParams, ageGroups = [], citizenGroups = [], projectLinks = [] }) {
  const { t } = useTranslation();
  const navigation = useNavigation();

  // Form state
  const [name, setName] = useState('');
  const [confidentialValue, setConfidentialValue] = useState('Visible');
  const [isPreviousPickerClosed, setIsPreviousPickerClosed] = useState(true);
  const [pickerAgeValue, setPickerAgeValue] = useState(null);
  const [selectedAge, setSelectedAge] = useState(null);
  const [pickerGenderValue, setPickerGenderValue] = useState(null);
  const [selectedCitizenGroupI, setSelectedCitizenGroupI] = useState(null);
  const [selectedCitizenGroupII, setSelectedCitizenGroupII] = useState(null);

  // Static gender options
  const genders = useMemo(
    () => [
      { label: t('male'), value: 'male' },
      { label: t('female'), value: 'female' },
    ],
    [t]
  );

  const projectId = stepOneParams?.selectedProject?.id || null;

  // Process age groups using shared utility (replaces inline processing)
  const processedAgeGroups = useMemo(() => {
    return processAgeGroups(ageGroups, projectId, projectLinks);
  }, [ageGroups, projectId, projectLinks]);

  // Process citizen groups for type 1 using shared utility (replaces inline processing)
  const citizenGroupsI = useMemo(() => {
    return processCitizenGroupsByType(citizenGroups, 1, projectId, projectLinks);
  }, [citizenGroups, projectId, projectLinks]);

  // Process citizen groups for type 2 using shared utility (replaces inline processing)
  const citizenGroupsII = useMemo(() => {
    return processCitizenGroupsByType(citizenGroups, 2, projectId, projectLinks);
  }, [citizenGroups, projectId, projectLinks]);

  // Event handlers
  const handleConfidentialValueChange = useCallback(
    (newValue) => {
      console.log(newValue);
      setConfidentialValue(newValue);
    },
    [confidentialValue]
  );

  const handleNameChange = useCallback((text) => {
    setName(text);
  }, []);

  const handleNavigateToStep2 = useCallback(() => {
    const navigationData = {
      ...stepOneParams,
      citizen: name,
      citizen_age_group: selectedAge?.id || selectedAge?.value,
      citizen_type: confidentialValue || 'Visible',
      citizen_group_1: selectedCitizenGroupI,
      citizen_group_2: selectedCitizenGroupII,
      gender: pickerGenderValue,
      selectedProject: stepOneParams?.selectedProject,
    };

    navigation.navigate('CitizenReportStep2', {
      stepOneParams: navigationData,
    });
  }, [
    navigation,
    stepOneParams,
    name,
    selectedAge,
    confidentialValue,
    selectedCitizenGroupI,
    selectedCitizenGroupII,
    pickerGenderValue,
  ]);

  const renderRadioButton = useCallback(
    (value, label) => (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
        <RadioButton.Android
          value={value}
          uncheckedColor="#dedede"
          color={colors.primary}
          onValueChange={(newValue) => {
            handleConfidentialValueChange(newValue);
          }}
          status={confidentialValue === value ? 'checked' : 'unchecked'}
        />
        <Text style={styles.radioLabel}>{label}</Text>
      </View>
    ),
    [handleConfidentialValueChange, confidentialValue]
  );

  // Show loading state while data is being loaded
  if (!ageGroups.length && !citizenGroups.length) {
    return (
      <ScrollView>
        <View style={{ padding: 23, alignItems: 'center' }}>
          <Text style={styles.stepText}>{t('step_2')}</Text>
          <Text style={styles.stepSubtitle}>Loading data...</Text>
          <Text style={styles.stepDescription}>
            Please wait while we load the age groups and citizen groups data from the database.
          </Text>
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        </View>
      </ScrollView>
    );
  }

  // Show error state if no age groups are available (age groups are required)
  if (!processedAgeGroups.length) {
    return (
      <ScrollView>
        <View style={{ padding: 23, alignItems: 'center' }}>
          <Text style={styles.stepText}>{t('step_2')}</Text>
          <Text style={[styles.stepSubtitle, { color: colors.error }]}>
            {t('error_loading_data')}
          </Text>
          <Text style={styles.stepDescription}>
            Age groups data is not available. Please check your internet connection and try again.
            Debug: Raw age groups count: {ageGroups.length}
          </Text>
          <Button
            mode="contained"
            style={{ marginTop: 20 }}
            onPress={() => {
              // Could implement a retry mechanism here if needed
              console.log('Retry button pressed - would refresh data');
              console.log('Raw age groups:', ageGroups);
              console.log('Raw citizen groups:', citizenGroups);
            }}
          >
            {t('retry_button')}
          </Button>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : null}>
        <View style={{ padding: 23 }}>
          <Text style={styles.stepText}>{t('step_2')}</Text>
          <Text style={styles.stepDescription}>{t('contact_step_subtitle')}</Text>
          <Text style={styles.stepNote}>{t('contact_step_explanation')}</Text>
        </View>

        <View style={{ paddingHorizontal: 50 }}>
          <TextInput
            style={styles.grmInput}
            placeholder={t('contact_step_placeholder_1')}
            outlineColor={colors.lightgray}
            theme={theme}
            mode="outlined"
            value={name}
            onChangeText={handleNameChange}
          />
          <Text />
          <RadioButton.Group
            onValueChange={handleConfidentialValueChange}
            value={confidentialValue}
          >
            {renderRadioButton('Confidential', t('step_2_keep_name_confidential'))}
            {renderRadioButton('On behalf of Individual', t('step_2_on_behalf_of_someone'))}
            {renderRadioButton(
              'On behalf of Organization',
              t('step_2_organization_behalf_someone')
            )}
          </RadioButton.Group>
        </View>
        <Text />

        {/* Age Groups Dropdown - Using processed data from shared utility */}
        <CustomDropDownPicker
          schema={{
            label: 'label', // Display field from processed data
            value: 'value', // Value field from processed data (Frappe name)
          }}
          zIndex={4000}
          zIndexInverse={1000}
          onSelectItem={setSelectedAge}
          placeholder={t('contact_step_placeholder_2')}
          value={pickerAgeValue}
          onOpen={() => setIsPreviousPickerClosed(false)}
          onClose={() => setIsPreviousPickerClosed(true)}
          items={processedAgeGroups}
          setPickerValue={setPickerAgeValue}
        />

        {isPreviousPickerClosed && (
          <>
            {/* Gender Dropdown */}
            <CustomDropDownPicker
              placeholder={t('contact_step_placeholder_3')}
              value={pickerGenderValue}
              items={genders}
              zIndex={3000}
              zIndexInverse={2000}
              setPickerValue={setPickerGenderValue}
            />

            {/* Citizen Group I Dropdown - Using processed data from shared utility */}
            <CustomDropDownPicker
              schema={{
                label: 'label', // Display field from processed data
                value: 'value', // Value field from processed data (Frappe name)
              }}
              zIndex={2000}
              zIndexInverse={3000}
              placeholder={t('contact_step_placeholder_5')}
              value={selectedCitizenGroupI}
              items={citizenGroupsI}
              setPickerValue={setSelectedCitizenGroupI}
            />

            {/* Citizen Group II Dropdown - Using processed data from shared utility */}
            <CustomDropDownPicker
              schema={{
                label: 'label', // Display field from processed data
                value: 'value', // Value field from processed data (Frappe name)
              }}
              placeholder={t('contact_step_placeholder_6')}
              value={selectedCitizenGroupII}
              zIndex={1000}
              zIndexInverse={4000}
              items={citizenGroupsII}
              setPickerValue={setSelectedCitizenGroupII}
            />

            <View style={{ paddingHorizontal: 50 }}>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={handleNavigateToStep2}
              >
                {t('next')}
              </Button>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

// Enhanced withObservables to provide reactive data from WatermelonDB
const enhance = withObservables([], () => ({
  ageGroups: watermelonManager.getDatabase().get('grm_issue_age_groups').query().observe(),
  citizenGroups: watermelonManager.getDatabase().get('grm_issue_citizen_groups').query().observe(),
  projectLinks: watermelonManager.getDatabase().get('grm_project_links').query().observe(),
}));

export default enhance(Content);

import { useNavigation } from '@react-navigation/native';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { ActivityIndicator, Button, RadioButton, TextInput } from 'react-native-paper';
import CustomDropDownPicker from '../../../../components/CustomDropDownPicker/CustomDropDownPicker';
import { useData } from '../../../../providers/DataProvider';
import { colors } from '../../../../utils/colors';
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

function Content({ stepOneParams }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { lookupData, isDataInitialized, isLoading, refreshContactData } = useData();
  const [name, setName] = useState('');
  const [confidentialValue, setConfidentialValue] = useState(null);
  const [isPreviousPickerClosed, setIsPreviousPickerClosed] = useState(true);
  const [pickerAgeValue, setPickerAgeValue] = useState(null);
  const [selectedAge, setSelectedAge] = useState(null);
  const [pickerGenderValue, setPickerGenderValue] = useState(null);
  const [selectedCitizenGroupI, setSelectedCitizenGroupI] = useState(null);
  const [selectedCitizenGroupII, setSelectedCitizenGroupII] = useState(null);

  const genders = useMemo(
    () => [
      { label: t('male'), value: 'male' },
      { label: t('female'), value: 'female' },
    ],
    [t]
  );

  // Use lookup data from DataProvider instead of PouchDB views
  const ages = useMemo(() => {
    if (!isDataInitialized) {
      console.log('🔍 [CONTACT] Age groups - not initialized yet');
      return [];
    }

    if (!lookupData.ageGroups || lookupData.ageGroups.length === 0) {
      console.log('🔍 [CONTACT] Age groups - no data available');
      return [];
    }

    const result = lookupData.ageGroups.map((ageGroup) => ({
      ...ageGroup,
      id: ageGroup._id || ageGroup.id,
      label: ageGroup.name,
      value: ageGroup._id || ageGroup.id,
    }));

    console.log(`✅ [CONTACT] Age groups processed: ${result.length} items`);
    return result;
  }, [lookupData.ageGroups, isDataInitialized]);

  // Handle citizen groups - they might be an array or nested object
  const citizenGroupsI = useMemo(() => {
    if (!isDataInitialized) {
      console.log('🔍 [CONTACT] Citizen groups I - not initialized yet');
      return [];
    }

    if (!lookupData.citizenGroups || lookupData.citizenGroups.length === 0) {
      console.log('🔍 [CONTACT] Citizen groups I - no data available');
      return [];
    }

    // Filter for group_type 1
    const groups = lookupData.citizenGroups.filter(
      (group) => group.group_type === '1' || group.group_type === 1
    );

    const result = groups.map((group) => ({
      ...group,
      id: group._id || group.id,
      label: group.name,
      value: group._id || group.id,
    }));

    console.log(`✅ [CONTACT] Citizen groups I processed: ${result.length} items`);
    return result;
  }, [lookupData.citizenGroups, isDataInitialized]);

  const citizenGroupsII = useMemo(() => {
    if (!isDataInitialized) {
      console.log('🔍 [CONTACT] Citizen groups II - not initialized yet');
      return [];
    }

    if (!lookupData.citizenGroups || lookupData.citizenGroups.length === 0) {
      console.log('🔍 [CONTACT] Citizen groups II - no data available');
      return [];
    }

    // Filter for group_type 2
    const groups = lookupData.citizenGroups.filter(
      (group) => group.group_type === '2' || group.group_type === 2
    );

    const result = groups.map((group) => ({
      ...group,
      id: group._id || group.id,
      label: group.name,
      value: group._id || group.id,
    }));

    console.log(`✅ [CONTACT] Citizen groups II processed: ${result.length} items`);
    return result;
  }, [lookupData.citizenGroups, isDataInitialized]);

  // Debug logging
  useEffect(() => {
    console.log('🔍 [CONTACT] Debug Info:', {
      isDataInitialized,
      ageGroupsCount: lookupData.ageGroups?.length || 0,
      citizenGroupsCount: lookupData.citizenGroups?.length || 0,
      processedAges: ages.length,
      processedGroupsI: citizenGroupsI.length,
      processedGroupsII: citizenGroupsII.length,
    });
  }, [isDataInitialized, lookupData, ages, citizenGroupsI, citizenGroupsII]);

  // Add refresh handler
  const handleRefreshData = useCallback(async () => {
    await refreshContactData();
  }, [refreshContactData]);

  // Add error state tracking
  const [dataError, setDataError] = useState(false);

  // Check for data availability
  useEffect(() => {
    if (isDataInitialized && (!lookupData.ageGroups?.length || !lookupData.citizenGroups?.length)) {
      console.warn('⚠️ [CONTACT] Required data missing after initialization');
      setDataError(true);
    } else {
      setDataError(false);
    }
  }, [isDataInitialized, lookupData]);

  const handleConfidentialValueChange = useCallback((newValue) => {
    setConfidentialValue((prevValue) => (newValue === prevValue ? null : newValue));
  }, []);

  const handleNameChange = useCallback((text) => {
    setName(text);
  }, []);

  const handleNavigateToStep2 = useCallback(() => {
    navigation.navigate('CitizenReportStep2', {
      stepOneParams: {
        ...stepOneParams,
        name,
        ageGroup: selectedAge,
        citizen_type: confidentialValue,
        citizen_group_1: selectedCitizenGroupI,
        citizen_group_2: selectedCitizenGroupII,
        gender: pickerGenderValue,
      },
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
          onPress={() => handleConfidentialValueChange(value)}
        />
        <Text style={styles.radioLabel}>{label}</Text>
      </View>
    ),
    [handleConfidentialValueChange]
  );

  // Show loading state while data is being initialized
  if (!isDataInitialized || isLoading) {
    return (
      <ScrollView>
        <View style={{ padding: 23, alignItems: 'center' }}>
          <Text style={styles.stepText}>{t('step_2')}</Text>
          <Text style={styles.stepSubtitle}>Loading data...</Text>
          <Text style={styles.stepDescription}>
            Please wait while we load the age groups and citizen groups data.
          </Text>
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        </View>
      </ScrollView>
    );
  }

  // Show error state with retry option
  if (dataError) {
    return (
      <ScrollView>
        <View style={{ padding: 23, alignItems: 'center' }}>
          <Text style={styles.stepText}>{t('step_2')}</Text>
          <Text style={[styles.stepSubtitle, { color: colors.error }]}>
            {t('error_loading_data')}
          </Text>
          <Text style={styles.stepDescription}>{t('error_loading_data_description')}</Text>
          <Button
            mode="contained"
            style={{ marginTop: 20 }}
            onPress={handleRefreshData}
            loading={isLoading}
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
            outlineColor="#dedede"
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
            {renderRadioButton(1, t('step_2_keep_name_confidential'))}
            {renderRadioButton(2, t('step_2_on_behalf_of_someone'))}
            {renderRadioButton(3, t('step_2_organization_behalf_someone'))}
          </RadioButton.Group>
        </View>
        <Text />
        <CustomDropDownPicker
          schema={{
            label: 'name',
            value: 'id',
          }}
          zIndex={4000}
          zIndexInverse={1000}
          onSelectItem={setSelectedAge}
          placeholder={t('contact_step_placeholder_2')}
          value={pickerAgeValue}
          onOpen={() => setIsPreviousPickerClosed(false)}
          onClose={() => setIsPreviousPickerClosed(true)}
          items={ages}
          setPickerValue={setPickerAgeValue}
        />
        {isPreviousPickerClosed && (
          <>
            <CustomDropDownPicker
              placeholder={t('contact_step_placeholder_3')}
              value={pickerGenderValue}
              items={genders}
              zIndex={3000}
              zIndexInverse={2000}
              setPickerValue={setPickerGenderValue}
            />
            <CustomDropDownPicker
              schema={{
                label: 'name',
                value: 'id',
              }}
              zIndex={2000}
              zIndexInverse={3000}
              placeholder={t('contact_step_placeholder_5')}
              value={selectedCitizenGroupI}
              items={citizenGroupsI}
              setPickerValue={setSelectedCitizenGroupI}
            />
            <CustomDropDownPicker
              schema={{
                label: 'name',
                value: 'id',
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

export default React.memo(Content);

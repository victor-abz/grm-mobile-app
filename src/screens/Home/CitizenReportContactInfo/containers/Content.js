import { useNavigation } from '@react-navigation/native';
import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { ActivityIndicator, Button, RadioButton, TextInput } from 'react-native-paper';
import { useView } from 'use-pouchdb';
import CustomDropDownPicker from '../../../../components/CustomDropDownPicker/CustomDropDownPicker';
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
  const [name, setName] = useState('');
  const [confidentialValue, setConfidentialValue] = useState(null);
  const [isPreviousPickerClosed, setIsPreviousPickerClosed] = useState(true);
  const [pickerAgeValue, setPickerAgeValue] = useState(null);
  const [selectedAge, setSelectedAge] = useState(null);
  const [pickerGenderValue, setPickerGenderValue] = useState(null);
  const [selectedCitizenGroupI, setSelectedCitizenGroupI] = useState(null);
  const [selectedCitizenGroupII, setSelectedCitizenGroupII] = useState(null);

  const genders = useMemo(() => [
    { label: t('male'), value: 'male' },
    { label: t('female'), value: 'female' },
  ], [t]);

  // Fetch all issue types at once
  const { rows: allIssueTypes, loading: allIssueTypesLoading } = useView('issues/all_issue_types', {
    db: 'LocalGRMDatabase',
    include_docs: true,
  });

  // Memoize the grouped issue types
  const groupedIssueTypes = useMemo(() => {
    const grouped = {};
    allIssueTypes.forEach((row) => {
      const [type] = row.key;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(row.doc);
    });
    return grouped;
  }, [allIssueTypes]);

  // Extract specific issue types
  const ages = useMemo(() => groupedIssueTypes.issue_age_group || [], [groupedIssueTypes]);
  const citizenGroupsI = useMemo(() => groupedIssueTypes.issue_citizen_group_1 || [], [groupedIssueTypes]);
  const citizenGroupsII = useMemo(() => groupedIssueTypes.issue_citizen_group_2 || [], [groupedIssueTypes]);

  console.log(ages)

  const handleConfidentialValueChange = useCallback((newValue) => {
    setConfidentialValue(prevValue => newValue === prevValue ? null : newValue);
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
  }, [navigation, stepOneParams, name, selectedAge, confidentialValue, selectedCitizenGroupI, selectedCitizenGroupII, pickerGenderValue]);

  const renderRadioButton = useCallback((value, label) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
      <RadioButton.Android
        value={value}
        uncheckedColor="#dedede"
        color={colors.primary}
        onPress={() => handleConfidentialValueChange(value)}
      />
      <Text style={styles.radioLabel}>{label}</Text>
    </View>
  ), [handleConfidentialValueChange]);

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
          <RadioButton.Group onValueChange={handleConfidentialValueChange} value={confidentialValue}>
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
              loading={allIssueTypesLoading}
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
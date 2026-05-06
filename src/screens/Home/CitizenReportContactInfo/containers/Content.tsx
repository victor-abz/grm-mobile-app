import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, TextInput, RadioButton } from 'react-native-paper';
import { i18n } from '../../../../translations/i18n';
import { styles } from './Content.styles';
import { colors } from '../../../../utils/colors';
import CustomDropDownPicker from '../../../../components/CustomDropDownPicker/CustomDropDownPicker';
import { ConfidentialityChoices } from '../../../../utils/constants';
import { showToast } from '../../../../utils/utils';

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: '#dedede',
    text: '#707070',
  },
};

// type RootStackParamList = {
//   CitizenReportStep2: {
//     stepOneParams: any;
//   };
//   // Add other routes if needed
// };

function Content({ stepOneParams, issueAges, citizenGroups }) {
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [checked, setChecked] = useState(false);
  const [nameError, setNameError] = React.useState<string>();
  const [isPreviousPickerClosed, setIsPreviousPickerClosed] = useState(true);
  const [pickerAgeValue, setPickerAgeValue] = useState(null);
  const [selectedAge, setSelectedAge] = useState(null);
  const [confidentialValue, setConfidentialValue] = useState(ConfidentialityChoices.CONFIDENTIAL);
  const [selectedCitizenGroup, setSelectedCitizenGroup] = useState(null);
  const [_citizenGroups, setCitizenGroups] = useState(citizenGroups ?? []);

  // State for each dropdown's selected value
  const [dropdownValues, setDropdownValues] = useState({});

  const [ages, setAges] = useState(issueAges ?? []);
  const [pickerGenderValue, setPickerGenderValue] = useState(null);
  const [genders, setGenders] = useState([
    { label: i18n.t('male'), value: 'male' },
    { label: i18n.t('female'), value: 'female' },
    // { label: i18n.t('other'), value: 'other' },
    // { label: i18n.t('rather_not_say'), value: 'rather_not_say' },
  ]);

  useEffect(() => {
    if (citizenGroups) {
      setCitizenGroups(citizenGroups);
    }

    if (issueAges) {
      setAges(issueAges);
    }
  }, [citizenGroups, issueAges]);

  // Combine both citizenGroups arrays if needed, or use one as source
  const allGroups = [...(_citizenGroups || [])];
  // Get unique types
  const types = Array.from(new Set(allGroups.map((g) => g.type)));

  return (
    <ScrollView>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : null}>
        <View style={{ padding: 23 }}>
          <Text style={styles.stepText}>{i18n.t('step_2')}</Text>
          <Text style={styles.stepDescription}>{i18n.t('contact_step_subtitle')}</Text>
          <Text style={styles.stepNote}>{i18n.t('contact_step_explanation')}</Text>
        </View>

        <View style={{ paddingHorizontal: 50 }}>
          <TextInput
            style={styles.grmInput}
            placeholder={i18n.t('contact_step_placeholder_1')}
            outlineColor="#dedede"
            theme={theme}
            mode="outlined"
            value={name}
            error={!!nameError}
            onChangeText={(text) => {
              setNameError(null);
              setName(text);
            }}
          />
          <Text />
          <RadioButton.Group
            onValueChange={(newValue) => {
              if (newValue === confidentialValue) {
                setConfidentialValue(ConfidentialityChoices.CONFIDENTIAL);
              } else {
                setConfidentialValue(newValue);
              }
            }}
            value={confidentialValue}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
              <RadioButton.Android
                value={ConfidentialityChoices.CONFIDENTIAL}
                uncheckedColor="#dedede"
                color={colors.primary}
              />
              <Text style={styles.radioLabel}>{i18n.t('step_2_keep_name_confidential')} </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
              <RadioButton.Android
                value={ConfidentialityChoices.INDIVIDUAL}
                uncheckedColor="#dedede"
                color={colors.primary}
              />
              <Text style={styles.radioLabel}>{i18n.t('step_2_on_behalf_of_someone')} </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
              <RadioButton.Android
                value={ConfidentialityChoices.ORGANIZATION}
                uncheckedColor="#dedede"
                color={colors.primary}
              />
              <Text style={styles.radioLabel}>{i18n.t('step_2_organization_behalf_someone')} </Text>
            </View>
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
          onSelectItem={(item) => setSelectedAge(item)}
          placeholder={i18n.t('contact_step_placeholder_2')}
          value={pickerAgeValue}
          onOpen={() => setIsPreviousPickerClosed(false)}
          onClose={() => setIsPreviousPickerClosed(true)}
          items={ages}
          setPickerValue={setPickerAgeValue}
          setItems={setAges}
        />
        {isPreviousPickerClosed && (
          <>
            <CustomDropDownPicker
              placeholder={i18n.t('contact_step_placeholder_3')}
              value={pickerGenderValue}
              items={genders}
              zIndex={3000}
              zIndexInverse={2000}
              setPickerValue={setPickerGenderValue}
              setItems={setGenders}
            />

            {(() => {
              // Helper to update dropdown value
              const handleDropdownChange = (type, value) => {
                setDropdownValues((prev) => ({ ...prev, [type]: value() }));
              };

              // Render a dropdown for each unique type
              if (!types.length || types[0] === undefined) return null;
              return types.map((type, index) => (
                <>
                  <Text style={[styles.stepNote, { paddingHorizontal: 50 }]}>
                    {type
                      .split(/[_\s]+/)
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')}
                  </Text>
                  <CustomDropDownPicker
                    key={type}
                    schema={{
                      label: 'name',
                      value: 'id',
                    }}
                    zIndex={2000 - index * 100} // adjust zIndex for stacking
                    zIndexInverse={3000 + index * 100}
                    placeholder={i18n.t(`contact_step_placeholder_${5 + index}`)}
                    value={dropdownValues[type]}
                    items={allGroups.filter((g) => g.type === type)}
                    setPickerValue={(val) => handleDropdownChange(type, val)}
                    setItems={() => {}} // no-op or implement if needed
                  />
                </>
              ));
            })()}
            <View style={{ paddingHorizontal: 50 }}>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={onNext()}
              >
                {i18n.t('next')}
              </Button>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </ScrollView>
  );

  function onNext(): (() => void) | (() => void) {
    return () => {
      if (!name) {
        setNameError('This field is required');
        showToast(i18n.t('please_choose_value_for_required_field'));
        return;
      }
      const payload = {
        ...stepOneParams,
        name,
        ageGroup: selectedAge,
        citizen_type: confidentialValue,
        citizen_group: dropdownValues[types[0]],
        citizen_group_2: dropdownValues[types[1]],
        gender: pickerGenderValue,
        filledOnSomebodyElseBehalf: checked,
      };

      navigation.navigate('CitizenReportStep2', {
        stepOneParams: payload,
      });
    };
  }
}

export default Content;
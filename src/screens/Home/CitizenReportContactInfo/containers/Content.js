import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, TextInput, RadioButton } from 'react-native-paper';
import { i18n } from "../../../../translations/i18n";
import { styles } from './Content.styles';
import { colors } from '../../../../utils/colors';
import CustomDropDownPicker from '../../../../components/CustomDropDownPicker/CustomDropDownPicker';

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: '#dedede',
    text: '#707070',
  },
};

function Content({ stepOneParams, issueAges, citizenGroups, citizenGroupsII }) {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [checked, setChecked] = useState(false);
  const [contactMethodError, setContactMethodError] = React.useState();
  const [isPreviousPickerClosed, setIsPreviousPickerClosed] = useState(true);
  const [pickerAgeValue, setPickerAgeValue] = useState(null);
  const [selectedAge, setSelectedAge] = useState(null);
  const [confidentialValue, setConfidentialValue] = useState(null);
  const [selectedCitizenGroup, setSelectedCitizenGroup] = useState(null);
  const [selectedCitizenGroupII, setSelectedCitizenGroupII] = useState(null);
  const [_citizenGroups, setCitizenGroups] = useState(citizenGroups ?? []);
  const [_citizenGroupsII, setCitizenGroupsII] = useState(citizenGroupsII ?? []);
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
    if (citizenGroupsII) {
      setCitizenGroupsII(citizenGroupsII);
    }
    if (issueAges) {
      setAges(issueAges);
    }
  }, [citizenGroups, citizenGroupsII, issueAges]);

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
            error={contactMethodError}
            onChangeText={(text) => {
              setName(text);
            }}
          />
          <Text />
          <RadioButton.Group
            onValueChange={(newValue) => {
              if (newValue === confidentialValue) {
                setConfidentialValue(0);
              } else {
                setConfidentialValue(newValue);
              }
            }}
            value={confidentialValue}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
              <RadioButton.Android value={1} uncheckedColor="#dedede" color={colors.primary} />
              <Text style={styles.radioLabel}>
                {i18n.t('step_2_keep_name_confidential')}{' '}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
              <RadioButton.Android value={2} uncheckedColor="#dedede" color={colors.primary} />
              <Text style={styles.radioLabel}>
                {i18n.t('step_2_on_behalf_of_someone')}{' '}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
              <RadioButton.Android value={3} uncheckedColor="#dedede" color={colors.primary} />
              <Text style={styles.radioLabel}>
                {i18n.t('step_2_organization_behalf_someone')}{' '}
              </Text>
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

            {/*  */}
            {/* TODO:si en la lista tiene dos types, muestras dos dropdowns o mas dependiendo de los atributos types, cuantos existen */}
            {/* */}

             {/* <CustomDropDownPicker
              schema={{
                label: 'name',
                value: 'id',
              }}
              zIndex={2000}
              zIndexInverse={3000}
              placeholder={i18n.t('contact_step_placeholder_5')}
              value={selectedCitizenGroup}
              items={_citizenGroups}
              setPickerValue={setSelectedCitizenGroup}
              setItems={setCitizenGroups}
            /> */}
           {/* <CustomDropDownPicker
              schema={{
                label: 'name',
                value: 'id',
              }}
              placeholder={i18n.t('contact_step_placeholder_6')}
              value={selectedCitizenGroupII}
              zIndex={4000}
              zIndexInverse={4000}
              items={_citizenGroupsII}
              setPickerValue={setSelectedCitizenGroupII}
              setItems={setCitizenGroupsII}
            /> */}
            <View style={{ paddingHorizontal: 50 }}>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={() => {
                  navigation.navigate('CitizenReportStep2', {
                    stepOneParams: {
                      ...stepOneParams,
                      name,
                      ageGroup: selectedAge,
                      citizen_type: confidentialValue,
                      citizen_group: selectedCitizenGroup,
                      // citizen_group_2: selectedCitizenGroupII,
                      gender: pickerGenderValue,
                      filledOnSomebodyElseBehalf: checked,
                    },
                  });
                }}
              >
                {i18n.t('next')}
              </Button>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

export default Content;

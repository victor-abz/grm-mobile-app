import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Button, RadioButton, TextInput } from 'react-native-paper';
import { useFind } from 'use-pouchdb';
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
  const [checked, setChecked] = useState(false);
  const [contactMethodError, setContactMethodError] = React.useState();
  const [isPreviousPickerClosed, setIsPreviousPickerClosed] = useState(true);
  const [pickerAgeValue, setPickerAgeValue] = useState(null);
  const [selectedAge, setSelectedAge] = useState(null);
  const [confidentialValue, setConfidentialValue] = useState(null);
  const [selectedCitizenGroupI, setSelectedCitizenGroupI] = useState(null);
  const [selectedCitizenGroupII, setSelectedCitizenGroupII] = useState(null);

  const [pickerGenderValue, setPickerGenderValue] = useState(null);
  const [genders, setGenders] = useState([
    { label: t('male'), value: 'male' },
    { label: t('female'), value: 'female' },
    // { label: t('other'), value: 'other' },
    // { label: t('rather_not_say'), value: 'rather_not_say' },
  ]);

  const { docs: ages, loading: agesLoading } = useFind({
    selector: {
      type: 'issue_age_group',
    },
    db: 'LocalGRMDatabase',
  });

  const { docs: _citizenGroupsI, loading: citizenGroupsILoading } = useFind({
    selector: {
      type: 'issue_citizen_group_1',
    },
    db: 'LocalGRMDatabase',
  });
  const { docs: _citizenGroupsII, loading: citizenGroupsIILoading } = useFind({
    selector: {
      type: 'issue_citizen_group_2',
    },
    db: 'LocalGRMDatabase',
  });

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
              <Text style={styles.radioLabel}>{t('step_2_keep_name_confidential')} </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
              <RadioButton.Android value={2} uncheckedColor="#dedede" color={colors.primary} />
              <Text style={styles.radioLabel}>{t('step_2_on_behalf_of_someone')} </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
              <RadioButton.Android value={3} uncheckedColor="#dedede" color={colors.primary} />
              <Text style={styles.radioLabel}>{t('step_2_organization_behalf_someone')} </Text>
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
          placeholder={t('contact_step_placeholder_2')}
          value={pickerAgeValue}
          onOpen={() => setIsPreviousPickerClosed(false)}
          onClose={() => setIsPreviousPickerClosed(true)}
          items={ages}
          setPickerValue={setPickerAgeValue}
          loading={agesLoading}
          //   setItems={setAges}
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
              setItems={setGenders}
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
              items={_citizenGroupsI}
              setPickerValue={setSelectedCitizenGroupI}
              loading={citizenGroupsILoading}
              //   setItems={setCitizenGroupsI}
            />
            <CustomDropDownPicker
              schema={{
                label: 'name',
                value: 'id',
              }}
              placeholder={t('contact_step_placeholder_6')}
              value={selectedCitizenGroupII}
              zIndex={4000}
              zIndexInverse={4000}
              items={_citizenGroupsII}
              setPickerValue={setSelectedCitizenGroupII}
              loading={citizenGroupsIILoading}
              //   setItems={setCitizenGroupsII}
            />
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
                      citizen_group_1: selectedCitizenGroupI,
                      citizen_group_2: selectedCitizenGroupII,
                      gender: pickerGenderValue,
                      filledOnSomebodyElseBehalf: checked,
                    },
                  });
                }}
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

export default Content;

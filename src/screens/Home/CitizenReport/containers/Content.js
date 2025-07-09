import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Button, RadioButton, TextInput } from 'react-native-paper';
import CustomDropDownPicker from '../../../../components/CustomDropDownPicker/CustomDropDownPicker';
import { colors } from '../../../../utils/colors';
import { styles } from './Content.styles';

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: colors.placeholder,
    text: '#707070',
  },
};

function Content({ selectedProject = null }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [contact_medium, setContactMedium] = React.useState('facilitator');
  const [dropdownDisabled, setDropdownDisabled] = React.useState(true);
  const [contactMethodError, setContactMethodError] = React.useState();
  const [contact_information, setContactInformation] = React.useState('');
  const [contact_info_type, setContactInfoType] = useState('email');
  const [items, setItems] = useState([
    { label: t('step_1_method_1'), value: 'phone_number' },
    { label: t('step_1_method_2'), value: 'whatsapp' },
    { label: t('step_1_method_3'), value: 'email' },
  ]);

  useEffect(() => {
    if (contact_medium === 'channel-alert') {
      setDropdownDisabled(false);
    } else {
      setDropdownDisabled(true);
      // Reset contact info type and information if not channel-alert
      setContactInfoType('');
      setContactInformation('');
    }
  }, [contact_medium]);

  return (
    <ScrollView>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : null}>
        <View style={{ padding: 23 }}>
          <Text style={styles.stepText}>{t('step_1')}</Text>
          <Text style={styles.stepDescription}>{t('stay_touch_question')}</Text>
          <Text style={styles.stepNote}>{t('step_1_hint_1')}</Text>
          <RadioButton.Group onValueChange={setContactMedium} value={contact_medium}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <RadioButton.Android
                value="anonymous"
                uncheckedColor="#dedede"
                color={colors.primary}
              />
              <Text style={styles.radioLabel}>{t('step_1_option_1')}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <RadioButton.Android
                value="facilitator"
                uncheckedColor="#dedede"
                color={colors.primary}
              />
              <Text style={styles.radioLabel}>{t('step_1_option_2')}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <RadioButton.Android
                value="channel-alert"
                uncheckedColor="#dedede"
                color={colors.primary}
              />
              <Text style={styles.radioLabel}>{t('step_1_option_3')}</Text>
            </View>
          </RadioButton.Group>
        </View>
        {!dropdownDisabled && (
          <>
            <CustomDropDownPicker
              disabled={dropdownDisabled}
              placeholder={t('step_1_placeholder_1')}
              value={contact_info_type}
              items={items}
              setPickerValue={setContactInfoType}
              setItems={setItems}
            />
            <View style={{ paddingHorizontal: 50 }}>
              <TextInput
                style={styles.grmInput}
                placeholder={t('step_1_placeholder_2')}
                outlineColor="#f6f6f6"
                theme={theme}
                error={contactMethodError}
                mode="outlined"
                value={contact_information}
                onChangeText={(text) => {
                  setContactMethodError();
                  setContactInformation(text);
                }}
              />
            </View>
          </>
        )}
        <View style={{ paddingHorizontal: 50 }}>
          <Button
            theme={theme}
            style={{ alignSelf: 'center', margin: 24 }}
            labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
            mode="contained"
            onPress={() => {
              if (!dropdownDisabled) {
                if (contact_information) {
                  navigation.navigate('CitizenReportContactInfo', {
                    stepOneParams: {
                      contact_medium,
                      contact_info_type,
                      contact_information,
                      selectedProject,
                    },
                  });
                } else {
                  setContactMethodError('Please insert a valid method of contact');
                }
              } else {
                navigation.navigate('CitizenReportContactInfo', {
                  stepOneParams: {
                    contact_medium,
                    contact_info_type: '',
                    contact_information: '',
                    selectedProject,
                  },
                });
              }
            }}
          >
            {t('next')}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

export default Content;

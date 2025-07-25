import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  Platform,
  KeyboardAvoidingView,
  TextInput as NativeTextInput,
  ToastAndroid,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Button, Checkbox, Dialog, Paragraph, Portal, TextInput } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import moment from 'moment';
import { i18n } from "../../../../translations/i18n";
import CustomDropDownPicker from '../../../../components/CustomDropDownPicker/CustomDropDownPicker';
import { colors } from '../../../../utils/colors';
import { styles } from './Content.styles';
import AddAttachmentCard from "../../GRM/components/AddAttachmentCard";

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: '#dedede',
    text: '#707070',
  },
};

function Content({ stepOneParams, issueCategories, issueTypes, issueSubTypes, issueComponents, issueSubComponents }) {
  const navigation = useNavigation();
  const [pickerValue, setPickerValue] = useState(null);
  const [pickerValue2, setPickerValue2] = useState(null);
  const [pickerValue3, setPickerValue3] = useState(null);
  const [pickerComponent, setPickerComponent] = useState(null);
  const [pickerSubComponent, setPickerSubComponent] = useState(null);
  const [checked, setChecked] = useState(false);
  const [additionalDetails, setAdditionalDetails] = useState(null);
  const [date, setDate] = useState(null);
  const [attachment, setAttachment] = useState({});
  const [recordingURI, setRecordingURI] = useState();
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [items, setItems] = useState(issueTypes ?? []);
  const [showRecordingCard, setShowRecordingCard] = useState(false);

  const [items2, setItems2] = useState(issueCategories ?? []);
  const [itemsSubTypes, setItemsSubTypes] = useState(issueSubTypes ?? []);
  const [components, setComponents] = useState(issueComponents ?? []);
  const [subComponents, setSubComponents] = useState(issueSubComponents ?? []);
  const [selectedIssueType, setSelectedIssueType] = useState(null);
  const [selectedIssueSubType, setSelectedIssueSubType] = useState(null);
  const [selectedIssueComponent, setSelectedIssueComponent] = useState(null);
  const [selectedIssueSubComponent, setSelectedIssueSubComponent] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  const _hideDialog = () => setShowDialog(false);
  const _showDialog = () => setShowDialog(true);

  useEffect(() => {
    if (issueTypes) {
      setItems(issueTypes);
    }
    if (issueCategories) {
      setItems2(issueCategories);
    }
    if (issueSubTypes) {
      setItemsSubTypes(issueSubTypes);
    }
    if (issueComponents) {
      setComponents(issueComponents);
    }
    if (issueSubComponents) {
      setSubComponents(issueSubComponents);
    }
  }, [issueTypes, issueCategories, issueSubTypes, issueComponents, issueSubComponents]);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();
  }, []);


  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (_date) => {
    setDate(_date);
    hideDatePicker();
  };

  const getCategory = (value) => {
    const result = issueCategories.filter((obj) => obj.name === value);
    const _category = {
      id: result[0].id,
      name: result[0].name,
      confidentiality_level: result[0].confidentiality_level,
      assigned_department: result[0].assigned_department?.id,
      administrative_level: result[0].assigned_department?.administrative_level,
    };
    return _category;
  };

  const filterSubType = () => {
    return itemsSubTypes.filter((obj) => obj.parent_id === selectedIssueType.id);
  };

  const filterCategory = () => {
    return items2.filter((obj) => obj.parent_id === selectedIssueSubType.id);
  };
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      // aspect: [4, 3],
      quality: 1,
    });
    
    if (!result.canceled && (result.localUri || (result.assets.length > 0 && result.assets[0].uri))) {

      const manipResult = await ImageManipulator.manipulateAsync(
        result.localUri || result.assets[0].uri,
        [{ resize: { width: 1000, height: 1000 } }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG },
      );      
      setAttachment({ ...manipResult, id: new Date() });
    }
  };
    const openCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && (result.localUri || (result.assets.length > 0 && result.assets[0].uri))) {
      const manipResult = await ImageManipulator.manipulateAsync(
        result.localUri || result.assets[0].uri,
        [{ resize: { width: 1000, height: 1000 } }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG },
      );
      setAttachment({ ...manipResult, id: new Date() });

    }
  };

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();
  }, []);
  const filterSubComponent = () => {
    return subComponents.filter((obj) => obj.parent_id === selectedIssueComponent.id);
  };

  const showToast = (message) => {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  };

  const onNext = () => {
    navigation.navigate('CitizenReportLocationStep', {
      stepOneParams,
      stepTwoParams: {
        date: date ? date.toISOString() : undefined,
        issueType: selectedIssueType
          ? { id: selectedIssueType.id, name: selectedIssueType.name }
          : null,
        issueSubType: selectedIssueSubType
          ? { id: selectedIssueSubType.id, name: selectedIssueSubType.name }
          : null,
        issueComponent: selectedIssueComponent
          ? { id: selectedIssueComponent.id, name: selectedIssueComponent.name }
          : null,
        // issueSubComponent: selectedIssueSubComponent
        //   ? { id: selectedIssueSubComponent.id, name: selectedIssueSubComponent.name }
        //   : null,
        ongoingEvent: checked,
        attachment: attachment.uri
          ? {
            url: '',
            id: attachment?.id,
            uploaded: false,
            local_url: attachment?.uri,
            name: attachment?.uri.split('/').pop(),
          }
          : undefined,
        recording: recordingURI
          ? {
            url: '',
            id: recordingURI.split('/').pop(),
            uploaded: false,
            local_url: recordingURI,
            isAudio: true,
            name: recordingURI.split('/').pop(),
          }
          : undefined,
        category: getCategory(pickerValue2),
        additionalDetails,
      },
    });
  };

  return (
    <ScrollView>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null}>
        <View style={{ padding: 23 }}>
          <Text style={styles.stepText}>{i18n.t('step_3')}</Text>
          <Text style={styles.stepDescription}>{i18n.t('step_2_subtitle')}</Text>
          <Text style={styles.stepNote}>{i18n.t('step_2_explanation')}</Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 23,
            paddingBottom: 10,
            justifyContent: 'space-between',
          }}
        >
          <Button
            theme={{ ...theme, colors: { ...theme.colors, primary: 'white' } }}
            icon="calendar"
            compact
            style={{
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 3,
              flex: 1,
              marginHorizontal: 10,
            }}
            uppercase={false}
            labelStyle={{
              color: colors.primary,
              fontFamily: 'Poppins_400Regular',
              fontSize: 13,
            }}
            mode="contained"
            onPress={showDatePicker}
          >
            {date ? moment(date).format('DD-MMMM-YY') : i18n.t('step_2_select_date')}
          </Button>
          <Button
            compact
            theme={theme}
            labelStyle={{
              color: 'white',
              fontFamily: 'Poppins_400Regular',
              fontSize: 12,
            }}
            mode="contained"
            uppercase={false}
            onPress={() => setDate(new Date())}
          >
            {i18n.t('step_2_set_today')}
          </Button>
        </View>
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 43,
            paddingBottom: 10,
            alignItems: 'center',
          }}
        >
          <Checkbox.Android
            color={colors.primary}
            status={checked ? 'checked' : 'unchecked'}
            onPress={() => {
              setChecked(!checked);
            }}
          />
          <Text style={[styles.stepNote, { flex: 1 }]}>{i18n.t('step_2_ongoing_hint')}</Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 23,
            marginBottom: 35,
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 2 }}/>
        </View>
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          maximumDate={new Date()}
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
        />
        <View>
          <CustomDropDownPicker
            schema={{
              label: 'name',
              value: 'name',
            }}
            zIndex={3000}
            zIndexInverse={2000}
            placeholder={i18n.t('step_2_placeholder_1')}
            value={pickerValue}
            items={items}
            setPickerValue={setPickerValue}
            setItems={setItems}
            onSelectItem={(item) => setSelectedIssueType(item)}
          />
        </View>
        <View style={{ zIndex: 2000 }}>
          <CustomDropDownPicker
            schema={{
              label: 'name',
              value: 'name',
            }}
            zIndex={3000}
            zIndexInverse={2000}
            placeholder={i18n.t('step_2_placeholder_5')}
            value={pickerValue3}
            items={(selectedIssueType ? filterSubType() : [])}
            setPickerValue={setPickerValue3}
            // setItems={setItemsSubTypes}
            onSelectItem={(item) => setSelectedIssueSubType(item)}
          />
        </View>
        <View style={{ zIndex: 1000 }}>
          <CustomDropDownPicker
            schema={{
              label: 'name',
              value: 'name',
              id: 'id',
              confidentiality_level: 'confidentiality_level',
              assigned_department: 'assigned_department',
            }}
            zIndex={3000}
            zIndexInverse={2000}
            placeholder={i18n.t('step_2_placeholder_2')}
            value={pickerValue2}
            items={(selectedIssueSubType ? filterCategory() : [])}
            setPickerValue={setPickerValue2}
            // setItems={setItems2}
          />
        </View>
        <View>
          <CustomDropDownPicker
            schema={{
              label: 'name',
              value: 'name',
            }}
            zIndex={3000}
            zIndexInverse={2000}
            placeholder={i18n.t('step_2_placeholder_6')}
            value={pickerComponent}
            items={components}
            setPickerValue={setPickerComponent}
            setItems={setComponents}
            onSelectItem={(item) => setSelectedIssueComponent(item)}
          />
        </View>
        {/* <View>
          <CustomDropDownPicker
            schema={{
              label: 'name',
              value: 'name',
            }}
            zIndex={3000}
            zIndexInverse={2000}
            placeholder={i18n.t('step_2_placeholder_7')}
            value={pickerSubComponent}
            items={(selectedIssueComponent ? filterSubComponent() : [])}
            setPickerValue={setPickerSubComponent}
            onSelectItem={(item) => setSelectedIssueSubComponent(item)}
          />
        </View> */}
        <View style={{ paddingHorizontal: 50 }}>
          <TextInput
            multiline
            numberOfLines={4}
            style={[
              styles.grmInput,
              {
                height: 100,
                justifyContent: 'flex-start',
                textAlignVertical: 'top',
                fontSize: 14
              },
            ]}
            placeholder={i18n.t('step_2_placeholder_3')}
            outlineColor="#dedede"
            theme={theme}
            mode="outlined"
            value={additionalDetails}
            onChangeText={(text) => setAdditionalDetails(text)}
            render={(innerProps) => (
              <NativeTextInput
                {...innerProps}
                style={[
                  innerProps.style,
                  {
                    paddingTop: 8,
                    paddingBottom: 8,
                    height: 100,
                  },
                ]}
              />
            )}
          />
        </View>
        <View style={{ paddingHorizontal: 50 }}>
          <Text
            style={{
              fontFamily: 'Poppins_400Regular',
              fontSize: 12,
              fontWeight: 'normal',
              fontStyle: 'normal',
              lineHeight: 18,
              letterSpacing: 0,
              textAlign: 'left',
              color: '#707070',
              marginVertical: 13,
            }}
          >
            {i18n.t('step_2_share_photos')}
          </Text>      
          <AddAttachmentCard
            theme={theme}
            onAttachmentChange={(a, r) => {
              setAttachment(a);
              setRecordingURI(r);
            }}
          />
        </View>
        <View style={{ paddingHorizontal: 50 }}>
          <Button
            theme={theme}
            style={{ alignSelf: 'center', margin: 24 }}
            labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
            mode="contained"
            onPress={() => {
              if (selectedIssueType === null || selectedIssueSubType === null || pickerValue2 === null) {
                showToast(i18n.t('please_choose_value_for_required_field'));
                return;
              }

              const selectedCategory = getCategory(pickerValue2);
              if (selectedCategory && selectedCategory.confidentiality_level === 'Confidential') {
                _showDialog();
                return;
              }
              onNext();
            }}
          >
            {i18n.t('next')}
          </Button>
        </View>
      </KeyboardAvoidingView>

      <Portal>
        <Dialog visible={showDialog} onDismiss={_hideDialog}>
          <Dialog.Title>{i18n.t('warning')}</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              {i18n.t('confidential_complaint')}
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              theme={theme}
              style={{
                alignSelf: 'center',
                backgroundColor: '#E74C3C',
                paddingLeft: 15,
                paddingRight: 15,
              }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={_hideDialog}
            >
              {i18n.t('no')}
            </Button>
            <Button
              theme={theme}
              style={{ alignSelf: 'center', margin: 24, paddingLeft: 15, paddingRight: 15 }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={() => {
                _hideDialog();
                onNext();
              }}
            >
              {i18n.t('yes')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

export default Content;

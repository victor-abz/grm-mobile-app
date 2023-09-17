import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ImageBackground,
  KeyboardAvoidingView,
  TextInput as NativeTextInput,
  Platform,
  ScrollView,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {
  Button,
  Checkbox,
  Dialog,
  IconButton,
  Paragraph,
  Portal,
  TextInput,
} from 'react-native-paper';
import { useFind } from 'use-pouchdb';
import CustomDropDownPicker from '../../../../components/CustomDropDownPicker/CustomDropDownPicker';
import { colors } from '../../../../utils/colors';
import RecordingCard from '../../GRM/components/RecordingCard';
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
  const [pickerValue, setPickerValue] = useState(null);
  const [pickerValue2, setPickerValue2] = useState(null);
  const [pickerValue3, setPickerValue3] = useState(null);
  const [pickerComponent, setPickerComponent] = useState(null);
  const [pickerSubComponent, setPickerSubComponent] = useState(null);
  const [checked, setChecked] = useState(false);
  const [additionalDetails, setAdditionalDetails] = useState(null);
  const [date, setDate] = useState(null);
  const [attachment, setAttachment] = useState({});
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(null);
  //   const [items, setItems] = useState(issueTypes ?? []);
  const [recordingURI, setRecordingURI] = useState();
  //   const [items2, setItems2] = useState(issueCategories ?? []);
  //   const [itemsSubTypes, setItemsSubTypes] = useState(issueSubTypes ?? []);
  //   const [components, setComponents] = useState(issueComponents ?? []);
  //   const [subComponents, setSubComponents] = useState(issueSubComponents ?? []);
  const [sound, setSound] = React.useState();
  const [selectedIssueType, setSelectedIssueType] = useState(null);
  const [selectedIssueSubType, setSelectedIssueSubType] = useState(null);
  const [selectedIssueComponent, setSelectedIssueComponent] = useState(null);
  const [selectedIssueSubComponent, setSelectedIssueSubComponent] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  const _hideDialog = () => setShowDialog(false);
  const _showDialog = () => setShowDialog(true);

  const { docs: items2, loading: issueCategoriesLoading } = useFind({
    selector: {
      type: 'issue_category',
    },
    db: 'LocalGRMDatabase',
  });
  const { docs: items, loading: issueTypesLoading } = useFind({
    selector: {
      type: 'issue_type',
    },
    db: 'LocalGRMDatabase',
  });
  const { docs: itemsSubTypes, loading: issueSubTypesLoading } = useFind({
    selector: {
      type: 'issue_sub_type',
    },
    db: 'LocalGRMDatabase',
  });

  const { docs: components, loading: issueComponentsLoading } = useFind({
    selector: {
      type: 'issue_component',
    },
    db: 'LocalGRMDatabase',
  });

  const { docs: subComponents, loading: issueSubComponentsLoading } = useFind({
    selector: {
      type: 'issue_sub_component',
    },
    db: 'LocalGRMDatabase',
  });

  React.useEffect(
    () =>
      sound
        ? () => {
            // console.log("Unloading Sound");
            sound.unloadAsync();
          }
        : undefined,
    [sound]
  );

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

  const onRecordingStatusUpdate = (recordingStatus) => {
    setCurrent(milliSecondToHHMMSS(recordingStatus.durationMillis));
  };

  const startRecording = async () => {
    try {
      // console.log("Requesting permissions..");
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      // console.log("Starting recording..");
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recording.startAsync().then((status) => {
        console.log('recording status: ', status);
      });
      setRecording(recording);
      recording.setOnRecordingStatusUpdate(onRecordingStatusUpdate);
      // console.log("Recording started");
    } catch (err) {
      // console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    // console.log("Stopping recording..");
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecordingURI(uri);
    setRecording(undefined);
    // console.log("Recording stopped and stored at", uri);
  };

  /**
   * Converts a milli second value to second, minute hour format : HH:mm:ss
   * @param value the millisecond value to convert
   */
  const milliSecondToHHMMSS = (value) => {
    const milliSecond = Number(value / 1000);
    const hour = Math.floor(milliSecond / 3600);
    const minute = Math.floor((milliSecond % 3600) / 60);
    const second = Math.floor((milliSecond % 3600) % 60);

    const hrs = hour > 0 ? (hour < 10 ? `0${hour}:` : `${hour}:`) : '';
    const mins = minute > 0 ? (minute < 10 ? `0${minute}:` : `${minute}:`) : '00:';
    const scnds = second > 0 ? (second < 10 ? `0${second}` : second) : '00';
    return `${hrs}${mins}${scnds}`;
  };

  const onPlaybackStatusUpdate = (playbackStatus) => {
    if (playbackStatus.didJustFinish) {
      setPlaying(false);
      setCurrent(milliSecondToHHMMSS(0));
    }
    setCurrent(milliSecondToHHMMSS(playbackStatus.positionMillis));
  };

  const playSound = async () => {
    // console.log("Loading Sound");
    const { sound } = await Audio.Sound.createAsync(
      { uri: recordingURI },
      null,
      onPlaybackStatusUpdate
    );
    setSound(sound);

    // console.log("Playing Sound");
    await sound.playAsync();
    setPlaying(true);
    setCurrent(milliSecondToHHMMSS(0));
  };

  const stopSound = async () => {
    await sound.stopAsync();
    setPlaying(false);
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

  const openCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      const manipResult = await ImageManipulator.manipulateAsync(
        result.localUri || result.uri,
        [{ resize: { width: 1000, height: 1000 } }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG }
      );
      setAttachment({ ...manipResult, id: new Date() });
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      // aspect: [4, 3],
      quality: 1,
    });
    if (!result.cancelled) {
      const manipResult = await ImageManipulator.manipulateAsync(
        result.localUri || result.uri,
        [{ resize: { width: 1000, height: 1000 } }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG }
      );
      setAttachment({ ...manipResult, id: new Date() });
    }
  };

  const getCategory = (value) => {
    const result = items2.filter((obj) => obj.name === value);
    const _category = {
      id: result[0].id,
      name: result[0].name,
      confidentiality_level: result[0].confidentiality_level,
      assigned_department: result[0].assigned_department?.id,
      administrative_level: result[0].assigned_department?.administrative_level,
    };
    return _category;
  };

  const filterSubType = () => itemsSubTypes.filter((obj) => obj.parent_id === selectedIssueType.id);

  const filterCategory = () => items2.filter((obj) => obj.parent_id === selectedIssueSubType.id);

  const filterSubComponent = () =>
    subComponents.filter((obj) => obj.parent_id === selectedIssueComponent.id);

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
        issueSubComponent: selectedIssueSubComponent
          ? { id: selectedIssueSubComponent.id, name: selectedIssueSubComponent.name }
          : null,
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
          <Text style={styles.stepText}>{t('step_3')}</Text>
          <Text style={styles.stepDescription}>{t('step_2_subtitle')}</Text>
          <Text style={styles.stepNote}>{t('step_2_explanation')}</Text>
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
            {date ? moment(date).format('DD-MMMM-YY') : t('step_2_select_date')}
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
            {t('step_2_set_today')}
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
          <Text style={[styles.stepNote, { flex: 1 }]}>{t('step_2_ongoing_hint')}</Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 23,
            marginBottom: 35,
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 2 }} />
        </View>
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          maximumDate={new Date()}
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
        />
        <View style={{ zIndex: 2000 }}>
          <CustomDropDownPicker
            schema={{
              label: 'name',
              value: 'name',
            }}
            zIndex={3000}
            zIndexInverse={2000}
            placeholder={t('step_2_placeholder_1')}
            value={pickerValue}
            items={items}
            setPickerValue={setPickerValue}
            loading={issueTypesLoading}
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
            placeholder={t('step_2_placeholder_5')}
            value={pickerValue3}
            items={selectedIssueType ? filterSubType() : []}
            setPickerValue={setPickerValue3}
            // setItems={setItemsSubTypes}
            loading={issueSubTypesLoading}
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
            placeholder={t('step_2_placeholder_2')}
            value={pickerValue2}
            items={selectedIssueSubType ? filterCategory() : []}
            setPickerValue={setPickerValue2}
            loading={issueCategoriesLoading}
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
            placeholder={t('step_2_placeholder_6')}
            value={pickerComponent}
            items={components}
            setPickerValue={setPickerComponent}
            loading={issueComponentsLoading}
            // setItems={setComponents}
            onSelectItem={(item) => setSelectedIssueComponent(item)}
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
            placeholder={t('step_2_placeholder_7')}
            value={pickerSubComponent}
            items={selectedIssueComponent ? filterSubComponent() : []}
            setPickerValue={setPickerSubComponent}
            loading={issueSubComponentsLoading}
            onSelectItem={(item) => setSelectedIssueSubComponent(item)}
          />
        </View>
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
                fontSize: 14,
              },
            ]}
            placeholder={t('step_2_placeholder_3')}
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
            {t('step_2_share_photos')}
          </Text>
          <View>
            {attachment.uri && (
              <ImageBackground
                source={{ uri: attachment.uri }}
                style={{
                  height: 160,
                  width: 160,
                  alignSelf: 'center',
                  justifyContent: 'flex-end',
                  marginVertical: 20,
                }}
              >
                <TouchableOpacity
                  onPress={() => setAttachment({})}
                  style={{
                    alignItems: 'center',
                    padding: 5,
                    backgroundColor: 'rgba(36, 195, 139, 1)',
                  }}
                >
                  <Text style={{ color: 'white' }}>X</Text>
                </TouchableOpacity>
              </ImageBackground>
            )}
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <Button
              theme={theme}
              style={{ alignSelf: 'center' }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={pickImage}
              uppercase={false}
            >
              {t('step_2_upload_attachment')}
            </Button>
            <View style={styles.iconButtonStyle}>
              <IconButton icon="camera" color={colors.primary} size={24} onPress={openCamera} />
            </View>
            {!recording && !recordingURI && (
              <View style={styles.iconButtonStyle}>
                <IconButton
                  icon={recording ? 'record-circle-outline' : 'microphone'}
                  color={recording ? '#f80102' : colors.primary}
                  size={24}
                  onPress={recording ? stopRecording : startRecording}
                />
              </View>
            )}
          </View>
        </View>
        {(recordingURI || recording) && (
          <RecordingCard
            recording={recording}
            onPlay={playSound}
            onPause={stopSound}
            playing={playing}
            current={current}
            onDelete={setRecordingURI}
            onStopRecording={stopRecording}
          />
        )}

        <View style={{ paddingHorizontal: 50 }}>
          <Button
            theme={theme}
            style={{ alignSelf: 'center', margin: 24 }}
            labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
            mode="contained"
            onPress={() => {
              if (
                selectedIssueType === null ||
                selectedIssueSubType === null ||
                pickerValue2 === null
              ) {
                showToast(t('please_choose_value_for_required_field'));
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
            {t('next')}
          </Button>
        </View>
      </KeyboardAvoidingView>

      <Portal>
        <Dialog visible={showDialog} onDismiss={_hideDialog}>
          <Dialog.Title>{t('warning')}</Dialog.Title>
          <Dialog.Content>
            <Paragraph>{t('confidential_complaint')}</Paragraph>
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
              {t('no')}
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
              {t('yes')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

export default Content;

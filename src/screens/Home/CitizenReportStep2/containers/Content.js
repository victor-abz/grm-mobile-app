import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  TextInput as NativeTextInput,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {
  ActivityIndicator,
  Button,
  Checkbox,
  Dialog,
  IconButton,
  Paragraph,
  Portal,
  TextInput,
} from 'react-native-paper';
import { withObservables } from '@nozbe/watermelondb/react';
import CustomDropDownPicker from '../../../../components/CustomDropDownPicker/CustomDropDownPicker';
import AttachmentList from '../../../../components/AttachmentList/AttachmentList';
import watermelonManager from '../../../../database/watermelonManager';
import { colors } from '../../../../utils/colors';
import { formatDuration } from '../../../../utils/functions';
import { styles } from './Content.styles';
import { useSelector } from 'react-redux';
import {
  processCategories,
  processTypes,
  getCategoryById,
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

const styles_audio = StyleSheet.create({
  container: {
    height: 7,
    backgroundColor: '#ccc',
    borderRadius: 10,
    margin: 10,
    width: 150,
  },
  bar: {
    height: 7,
    backgroundColor: '#333',
    borderRadius: 10,
  },
});

function Content({ stepOneParams, categories = [], types = [], projectLinks = [] }) {
  const { t } = useTranslation();
  const navigation = useNavigation();

  // Form state
  const [pickerValue, setPickerValue] = useState(null);
  const [pickerValue2, setPickerValue2] = useState(null);
  const [pickerValue3, setPickerValue3] = useState(null);
  const [pickerComponent, setPickerComponent] = useState(null);
  const [pickerSubComponent, setPickerSubComponent] = useState(null);
  const [checked, setChecked] = useState(false);
  const [additionalDetails, setAdditionalDetails] = useState(null);
  const [date, setDate] = useState(null);
  const [attachment, setAttachment] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(null);
  const [recordingURI, setRecordingURI] = useState();
  const [recordingURIs, setRecordingURIs] = useState([]);
  const [sound, setSound] = React.useState();
  const [soundOnPause, setSoundOnPause] = useState(false);
  const [soundUrl, setSoundUrl] = React.useState();
  const [selectedIssueType, setSelectedIssueType] = useState(null);
  const [selectedIssueSubType, setSelectedIssueSubType] = useState(null);
  const [selectedIssueComponent, setSelectedIssueComponent] = useState(null);
  const [selectedIssueSubComponent, setSelectedIssueSubComponent] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImageUri, setModalImageUri] = useState(null);

  const _hideDialog = () => setShowDialog(false);
  const _showDialog = () => setShowDialog(true);

  const { username } = useSelector((state) => state.get('authentication').toObject());

  const projectId = stepOneParams?.selectedProject?.id || null;

  // Process categories using shared utility with project filtering
  const processedCategories = useMemo(() => {
    return processCategories(categories, projectId, projectLinks);
  }, [categories, projectId, projectLinks]);

  // Process types using shared utility with project filtering
  const processedTypes = useMemo(() => {
    return processTypes(types, projectId, projectLinks);
  }, [types, projectId, projectLinks]);

  // Placeholder for sub-types (not implemented in current Frappe structure)
  const itemsSubTypes = useMemo(() => {
    console.log('🔍 [STEP2] ItemsSubTypes - returning empty array (not implemented)');
    return [];
  }, []);

  // Placeholder for components (not implemented in current Frappe structure)
  const components = useMemo(() => {
    console.log('🔍 [STEP2] Components - returning empty array (not implemented)');
    return [];
  }, []);

  // Placeholder for sub-components (not implemented in current Frappe structure)
  const subComponents = useMemo(() => {
    console.log('🔍 [STEP2] SubComponents - returning empty array (not implemented)');
    return [];
  }, []);

  // Filtering logic for sub-types (currently empty)
  const filterSubType = useMemo(() => {
    const result = selectedIssueType
      ? itemsSubTypes.filter((obj) => obj.parent_id === selectedIssueType.id)
      : [];
    console.log('🔍 [STEP2] FilterSubType result:', result);
    return result;
  }, [selectedIssueType, itemsSubTypes]);

  // Show all categories (using processed categories from shared utility)
  const filterCategory = useMemo(() => {
    console.log(
      '🔍 [STEP2] FilterCategory - using processed categories:',
      processedCategories.length
    );
    return processedCategories;
  }, [processedCategories]);

  // Filtering logic for sub-components (currently empty)
  const filterSubComponent = useMemo(() => {
    const result = selectedIssueComponent
      ? subComponents.filter((obj) => obj.parent_id === selectedIssueComponent.id)
      : [];
    console.log('🔍 [STEP2] FilterSubComponent result:', result);
    return result;
  }, [selectedIssueComponent, subComponents]);

  React.useEffect(
    () =>
      sound
        ? () => {
            sound.unloadAsync();
          }
        : undefined,
    [sound]
  );

  // Add for pulsating animation:
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert(t('Sorry, we need camera roll permissions to make this work!'));
          return;
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

  const getAudioDuration = async (sound_url) => {
    const soundObject = new Audio.Sound();
    let durationSecond;
    try {
      // Load the audio file (replace 'your-audio-file.mp3' with your actual file)
      await soundObject.loadAsync({ uri: sound_url });

      // Get the status of the audio
      const status = await soundObject.getStatusAsync();

      // Convert the duration from milliseconds to seconds
      durationSecond = status.durationMillis / 1000;
    } catch (error) {
      console.error('Error loading audio:', error);
    } finally {
      // Unload the sound object to free up resources
      await soundObject.unloadAsync();
    }
    return durationSecond;
  };

  const startRecording = async () => {
    if (recordingURIs.length < 4) {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
        await recording.startAsync();
        setRecording(recording);
        console.log('🎙️ Recording started');
      } catch (err) {
        console.error('Failed to start recording:', err);
      }
    } else {
      ToastAndroid.show(`${t('error_message_for_limit_audio')}`, ToastAndroid.SHORT);
    }
  };

  const stopRecording = async () => {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    const d = await getAudioDuration(uri);
    setRecordingURI(uri);
    setRecordingURIs([
      ...recordingURIs,
      {
        id: new Date().toISOString(),
        local_url: uri,
        fileName: uri.split('/').pop(),
        type: 'audio',
        duration: formatDuration(d),
      },
    ]);
    setRecording(undefined);
    console.log('🎙️ Recording stopped and saved');
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

  // Format recording duration for display
  // Removed formatRecordingDuration function

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
          alert(t('Sorry, we need camera roll permissions to make this work!'));
          return;
        }
      }
    })();
  }, []);

  const get_image_manipulate = async (localUri, width, height) => {
    let manipResult;
    const imageSize = await getImageSize(localUri);

    if (!height || !width) {
      const dimensions = await getImageDimensions(localUri);
      width = width ?? dimensions.width;
      height = height ?? dimensions.height;
    }

    if (imageSize && imageSize > 1) {
      manipResult = await ImageManipulator.manipulateAsync(
        localUri,
        [{ resize: { width: width, height: height } }],
        { compress: 0.2 } //, format: ImageManipulator.SaveFormat.PNG },
      );
    } else {
      manipResult = await ImageManipulator.manipulateAsync(
        localUri,
        [{ resize: { width: width, height: height } }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG }
      );
    }
    return manipResult;
  };

  // Utility to handle picked image asset from gallery or camera
  const handlePickedImage = async (asset) => {
    if (!asset || !asset.uri) {
      ToastAndroid.show(t('Invalid Image'), ToastAndroid.SHORT);
      return;
    }
    setLoading(true);
    let width = asset.width;
    let height = asset.height;
    if (!width || !height) {
      try {
        const dimensions = await getImageDimensions(asset.uri);
        width = width || dimensions.width;
        height = height || dimensions.height;
      } catch (e) {}
    }
    let manipResult = await get_image_manipulate(asset.uri, width, height);
    setAttachments([
      ...attachments,
      {
        id: new Date().toISOString(),
        local_url: manipResult.uri,
        fileName: asset.fileName || asset.uri.split('/').pop(),
        type: 'image',
      },
    ]);
    setLoading(false);
  };

  const openCamera = async () => {
    if (attachments.length < 3) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.cancelled) {
        setLoading(true);

        let localUri = result.localUri || result.uri;
        let manipResult = await get_image_manipulate(
          localUri,
          result.assets && result.assets.length > 0 ? result.assets[0].width : null,
          result.assets && result.assets.length > 0 ? result.assets[0].height : null
        );

        setAttachments([...attachments, { ...manipResult, id: new Date() }]);
        setLoading(false);
      }
    } else {
      ToastAndroid.show(`${t('step_2_only_three_files')}`, ToastAndroid.SHORT);
    }
  };
  const getImageDimensions = async (imageUri) => {
    return new Promise((resolve, reject) => {
      Image.getSize(
        imageUri,
        (width, height) => {
          resolve({ width, height });
        },
        (error) => {
          reject(error);
        }
      );
    });
  };

  const getImageSize = async (imageUri) => {
    let fileSizeInMB = 0;
    try {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      const fileSizeInBytes = fileInfo.size;
      fileSizeInMB = fileSizeInBytes ? fileSizeInBytes / (1024 * 1024) : 0; // Convert bytes to MB
      console.log('Image size:', fileSizeInMB, 'MB');
    } catch (error) {
      console.error('Error getting image size:', error);
    }
    return fileSizeInMB;
  };
  const pickImage = async () => {
    if (attachments.length < 3) {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handlePickedImage(result.assets[0]);
      }
    } else {
      ToastAndroid.show(`${t('step_2_only_three_files')}`, ToastAndroid.SHORT);
    }
  };

  const takePhoto = async () => {
    if (attachments.length < 3) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handlePickedImage(result.assets[0]);
      }
    } else {
      ToastAndroid.show(`${t('step_2_only_three_files')}`, ToastAndroid.SHORT);
    }
  };

  const pickAudio = async () => {
    if (recordingURIs.length < 4) {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['audio/*'],
          multiple: false,
        });
        if (result.type != 'cancel') {
          setLoading(true);
          let localUri = result.uri;
          setRecordingURIs([
            ...recordingURIs,
            {
              id: new Date().toISOString(),
              local_url: localUri,
              fileName: localUri.split('/').pop(),
              type: 'audio',
              duration: '',
            },
          ]);
          setLoading(false);
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      ToastAndroid.show(`${t('error_message_for_limit_audio')}`, ToastAndroid.SHORT);
    }
  };

  // Use shared utility to get category (replaces inline getCategory function)
  const getCategory = useCallback(
    (value) => {
      return getCategoryById(categories, value);
    },
    [categories]
  );

  const showToast = (message) => {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  };

  const onNext = useCallback(() => {
    navigation.navigate('CitizenReportLocationStep', {
      stepOneParams,
      stepTwoParams: {
        date: date ? date.toISOString() : undefined,
        issueType: selectedIssueType
          ? {
              id: selectedIssueType.id,
              name: selectedIssueType.id,
              typeName: selectedIssueType.typeName,
            }
          : null,
        issueSubType: selectedIssueSubType
          ? { id: selectedIssueSubType.id, name: selectedIssueSubType.id }
          : null,
        issueComponent: selectedIssueComponent
          ? { id: selectedIssueComponent.id, name: selectedIssueComponent.id }
          : null,
        issueSubComponent: selectedIssueSubComponent
          ? { id: selectedIssueSubComponent.id, name: selectedIssueSubComponent.id }
          : null,
        ongoingEvent: checked,
        attachments: attachments.length > 0 ? attachments : undefined,
        recordings: recordingURIs.length > 0 ? recordingURIs : [],
        category: getCategory(pickerValue2),
        additionalDetails,
      },
    });
  }, [
    navigation,
    stepOneParams,
    date,
    selectedIssueType,
    selectedIssueSubType,
    selectedIssueComponent,
    selectedIssueSubComponent,
    checked,
    attachments,
    recordingURIs,
    getCategory,
    pickerValue2,
    additionalDetails,
  ]);

  const removeAttachment = (index) => {
    const array = [...attachments];
    array.splice(index, 1);
    setAttachments(array);
  };

  // Audio playback functions (referenced in the UI but missing)
  const playASound = useCallback(
    async (uri) => {
      try {
        if (sound) {
          await sound.unloadAsync();
        }
        const { sound: newSound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
        setSound(newSound);
        setSoundUrl(uri);
        setSoundOnPause(false);
      } catch (error) {
        console.error('Error playing sound:', error);
      }
    },
    [sound]
  );

  const pauseASound = useCallback(async () => {
    try {
      if (sound) {
        await sound.pauseAsync();
        setSoundOnPause(true);
      }
    } catch (error) {
      console.error('Error pausing sound:', error);
    }
  }, [sound]);

  const playASoundOnCurrentPause = useCallback(async () => {
    try {
      if (sound) {
        await sound.playAsync();
        setSoundOnPause(false);
      }
    } catch (error) {
      console.error('Error resuming sound:', error);
    }
  }, [sound]);

  const reomveARecordingURI = useCallback(
    (localUrl) => {
      setRecordingURIs(recordingURIs.filter((item) => item.local_url !== localUrl));
      if (soundUrl === localUrl) {
        setSoundUrl(null);
        setSoundOnPause(false);
      }
    },
    [recordingURIs, soundUrl]
  );

  const getProgress = useCallback(() => {
    // Simple progress calculation - could be enhanced
    return '50%';
  }, []);

  // Mock position for audio playback
  const [position, setPosition] = useState(0);

  // Debug logging for data structures
  useEffect(() => {
    console.log('🔍 CitizenReportStep2 Debug Info:', {
      categoriesCount: categories.length,
      typesCount: types.length,
      processedCategoriesCount: processedCategories.length,
      processedTypesCount: processedTypes.length,
    });
    if (processedCategories.length > 0) {
      console.log('🔍 [STEP2] Sample processed category:', {
        id: processedCategories[0].id,
        categoryName: processedCategories[0].categoryName,
        confidentiality_level: processedCategories[0].confidentiality_level,
      });
    }
    if (processedTypes.length > 0) {
      console.log('🔍 [STEP2] Sample processed type:', {
        id: processedTypes[0].id,
        typeName: processedTypes[0].typeName,
      });
    }
  }, [categories, types, processedCategories, processedTypes]);

  // Show loading state while data is being loaded
  if (!categories.length && !types.length) {
    return (
      <ScrollView>
        <View style={{ padding: 23, alignItems: 'center' }}>
          <Text style={styles.stepText}>{t('step_2')}</Text>
          <Text style={styles.stepSubtitle}>{t('Loading data...')}</Text>
          <Text style={styles.stepDescription}>
            Please wait while we load the categories and types data from the database.
          </Text>
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        </View>
      </ScrollView>
    );
  }

  // Show error state if no categories are available (categories are required)
  if (processedCategories.length === 0) {
    return (
      <ScrollView>
        <View style={{ padding: 23 }}>
          <Text style={styles.stepText}>{t('step_2')}</Text>
          <Text style={[styles.stepSubtitle, { color: colors.error }]}>
            {t('error_loading_data')}
          </Text>
          <Text style={styles.stepDescription}>
            Issue categories data is not available. Please check your internet connection and try
            again. Debug Info:{' '}
            {JSON.stringify({
              categoriesCount: categories.length,
              typesCount: types.length,
              processedCategoriesCount: processedCategories.length,
              processedTypesCount: processedTypes.length,
            })}
          </Text>
          <Button
            mode="contained"
            style={{ marginTop: 20 }}
            onPress={() => {
              // Could implement a retry mechanism here if needed
              console.log('Retry button pressed - would refresh data');
              console.log('Raw categories:', categories);
              console.log('Raw types:', types);
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
        {/* Issue Types Dropdown - Using processed data from shared utility */}
        <View style={{ zIndex: 2000 }}>
          <CustomDropDownPicker
            schema={{
              label: 'typeName',
              value: 'id',
            }}
            zIndex={3000}
            zIndexInverse={2000}
            placeholder={t('step_2_placeholder_1')}
            value={pickerValue}
            items={processedTypes}
            setPickerValue={setPickerValue}
            loading={!processedTypes.length}
            onSelectItem={(item) => setSelectedIssueType(item)}
          />
        </View>
        {/* Issue Categories Dropdown - Using processed data from shared utility */}
        <View style={{ zIndex: 1000 }}>
          <CustomDropDownPicker
            schema={{
              label: 'categoryName',
              value: 'id',
              id: 'id',
              confidentiality_level: 'confidentiality_level',
              assigned_department: 'assigned_department_id',
            }}
            zIndex={3000}
            zIndexInverse={2000}
            placeholder={t('step_2_placeholder_2')}
            value={pickerValue2}
            items={filterCategory}
            setPickerValue={setPickerValue2}
            loading={!processedCategories.length}
            // setItems={setItems2}
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
            outlineColor={colors.lightgray}
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
        <View style={{ paddingHorizontal: 40 }}>
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
          {/* Combined Attachment and Recording List */}
          <AttachmentList
            attachments={[...attachments, ...recordingURIs]}
            showTypeHeaders={false}
            showRemoveButton={true}
            onImagePress={(item) => {
              setModalImageUri(item.local_url);
              setModalVisible(true);
            }}
            onRemoveAttachment={(index) => {
              if (index < attachments.length) {
                removeAttachment(index);
              } else {
                const recordingIndex = index - attachments.length;
                const recording = recordingURIs[recordingIndex];
                reomveARecordingURI(recording.local_url);
              }
            }}
            style={{ marginVertical: 10 }}
          />
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
              <IconButton icon="camera" iconColor={colors.primary} size={24} onPress={takePhoto} />
            </View>
            <View style={styles.iconButtonStyle}>
              <IconButton
                icon={recording ? 'record-circle-outline' : 'microphone'}
                iconColor={recording ? '#f80102' : colors.primary}
                size={24}
                onPress={recording ? stopRecording : startRecording}
              />
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 50 }}>
          <Button
            theme={theme}
            style={{ alignSelf: 'center', margin: 24 }}
            disabled={!additionalDetails || !date || !pickerValue2 || !selectedIssueType}
            labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
            mode="contained"
            onPress={() => {
              if (selectedIssueType === null || pickerValue2 === null || pickerValue2 === null) {
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

      {/* Fullscreen Image Modal */}
      {modalVisible && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.95)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <TouchableOpacity
            style={{ position: 'absolute', top: 40, right: 20, zIndex: 10000 }}
            onPress={() => setModalVisible(false)}
          >
            <MaterialCommunityIcons name="close" size={36} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: modalImageUri }}
            style={{ width: '90%', height: '70%', resizeMode: 'contain' }}
          />
        </View>
      )}
    </ScrollView>
  );
}

// Enhanced withObservables to provide reactive data from WatermelonDB
const enhance = withObservables([], () => ({
  categories: watermelonManager.getDatabase().get('grm_issue_categories').query().observe(),
  types: watermelonManager.getDatabase().get('grm_issue_types').query().observe(),
  projectLinks: watermelonManager.getDatabase().get('grm_project_links').query().observe(),
}));

export default enhance(Content);

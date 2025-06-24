import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, Text, View, Alert } from 'react-native';
import { Button, Dialog, Paragraph, Portal } from 'react-native-paper';
import { withObservables } from '@nozbe/watermelondb/react';
import watermelonManager from '../../../../database/watermelonManager';
import dataManager from '../../../../services/DataManager'; // Import DataManager for proper API sync
import { colors } from '../../../../utils/colors';
import { styles } from './Content.styles';

const SAMPLE_WORDS = ['car', 'house', 'tree', 'ball'];
const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: '#dedede',
    text: '#707070',
  },
};

function Content({
  stepOneParams,
  stepTwoParams,
  stepLocationParams,
  categories = [], // From withObservables if needed for display
  types = [], // From withObservables if needed for display
}) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [showDialog, setShowDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const _hideDialog = () => setShowDialog(false);
  const _showDialog = () => setShowDialog(true);

  const randomWord = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const [sound, setSound] = useState();
  const [playing, setPlaying] = useState(false);

  const submitIssue = async () => {
    try {
      setIsSubmitting(true);

      console.log('🔍 [STEP3] Starting issue submission...');
      console.log('🔍 [STEP3] stepOneParams:', stepOneParams);
      console.log('🔍 [STEP3] stepTwoParams:', stepTwoParams);
      console.log('🔍 [STEP3] stepLocationParams:', stepLocationParams);

      // Prepare issue data in format expected by backend API
      const issueDate = stepTwoParams.date ? new Date(stepTwoParams.date) : new Date();
      const intakeDate = new Date();

      const issueData = {
        // Core issue identification - use direct IDs from selections
        issue_type_id: stepTwoParams.issueType?.id || '',
        category_id: stepTwoParams.category?.id || '',

        // Location
        administrative_region_id: stepLocationParams.issueLocation?.id || '',
        issue_location: stepLocationParams.locationDescription || '',

        // Issue details
        description: stepTwoParams.additionalDetails || '',
        // ✅ FIXED: Convert to ISO datetime format that Frappe can parse
        issue_date: issueDate.toISOString(),
        intake_date: intakeDate.toISOString(),

        // Citizen information from step 1
        citizen: stepOneParams.name || '',
        citizen_type: stepOneParams.typeOfPerson || 'facilitator',
        gender: stepOneParams.gender || '',
        contact_medium: stepOneParams.typeOfPerson || 'facilitator',
        contact_info_type: stepOneParams.methodOfContact || 'email',
        contact_information: stepOneParams.contactInfo || '',

        // Optional citizen groupings from step 1
        citizen_age_group_id: stepOneParams.selectedAge?.id || null,
        citizen_group_1_id: stepOneParams.selectedCitizenGroupI?.id || null,
        citizen_group_2_id: stepOneParams.selectedCitizenGroupII?.id || null,

        // Generate tracking code
        tracking_code: `${randomWord(SAMPLE_WORDS)}${Math.floor(Math.random() * 1000)}`,

        // Set confirmed flag
        confirmed: true,

        // Set default status as pending/submitted
        status_id: 'pending',

        // Set reporter (would need to get from user context)
        reporter_id: stepOneParams.reporterId || 'mobile_app_user',

        // Set project if available
        project_id: stepLocationParams.projectId || '',
      };

      console.log('🔍 [STEP3] Prepared issue data for DataManager:', issueData);
      console.log(
        '🔍 [STEP3] Date formats - issue_date:',
        issueData.issue_date,
        'intake_date:',
        issueData.intake_date
      );

      // ✅ USE DataManager instead of watermelonManager directly
      // This ensures proper API sync when online and local storage when offline
      console.log('🔍 [STEP3] Creating issue via DataManager (handles API sync)...');
      const newIssue = await dataManager.createIssue(issueData);

      console.log('✅ [STEP3] Issue created via DataManager successfully!');
      console.log('✅ [STEP3] Created issue details:', {
        id: newIssue.id,
        name: newIssue.name,
        trackingCode: newIssue.tracking_code || newIssue.trackingCode,
        issueTypeId: newIssue.issue_type_id,
        categoryId: newIssue.category_id,
        status: newIssue.status_id,
      });

      // Verify the issue was actually saved by trying to fetch it from local database
      console.log('🔍 [STEP3] Verifying issue was saved locally...');
      try {
        const savedIssue = await watermelonManager.getIssue(newIssue.id);
        if (savedIssue) {
          console.log('✅ [STEP3] Issue verification successful - issue found in local database');
          console.log('✅ [STEP3] Saved issue details:', savedIssue);
        } else {
          console.error('❌ [STEP3] Issue verification failed - issue not found in local database');
          throw new Error('Issue was not properly saved to local database');
        }
      } catch (verifyError) {
        console.error('❌ [STEP3] Error verifying saved issue:', verifyError);
        throw new Error('Failed to verify issue was saved: ' + verifyError.message);
      }

      // Navigation happens immediately after verification
      const issueId = newIssue.id;
      const trackingCode = newIssue.tracking_code || newIssue.trackingCode;

      console.log(
        '🔍 [STEP3] Navigating to Step 4 with issue ID:',
        issueId,
        'tracking code:',
        trackingCode
      );
      navigation.navigate('CitizenReportStep4', {
        issueId: issueId,
        trackingCode: trackingCode,
      });
    } catch (error) {
      console.error('❌ [STEP3] Error creating issue:', error);
      console.error('❌ [STEP3] Error stack:', error.stack);
      Alert.alert(t('error'), t('issue_creation_error'), [{ text: t('ok'), style: 'default' }], {
        cancelable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    // Check if category requires confirmation dialog using the data as it comes from step 2
    if (stepTwoParams.category && stepTwoParams.category.confidentiality_level === 'Confidential') {
      _showDialog();
    } else {
      submitIssue();
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

  useEffect(
    () =>
      sound
        ? () => {
            sound.unloadAsync();
          }
        : undefined,
    [sound]
  );

  const playSound = async (recordingUri) => {
    if (!playing) {
      setPlaying(true);
      const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
      setSound(sound);
      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlaying(false);
        }
      });
    }
  };

  return (
    <ScrollView>
      <View style={{ padding: 23 }}>
        <Text style={styles.stepText}>{t('step_5')}</Text>
        <Text style={styles.stepSubtitle}>{t('step_3_confirmation')}</Text>
        <Text style={styles.stepDescription}>{t('step_3_subtitle')}</Text>
      </View>

      {/* STEP 3 SUMMARY - Using data as it comes from previous steps */}
      <View style={styles.cardConfirm}>
        <View>
          <Text style={styles.stepSubtitle}>{t('step_3_field_title_1')}</Text>
          <Text style={styles.stepDescription}>
            {stepTwoParams.date && stepTwoParams.date !== 'null'
              ? moment(stepTwoParams.date).format('DD-MMMM-YYYY')
              : '--'}
          </Text>
        </View>

        <View>
          <Text style={styles.stepSubtitle}>{t('step_3_field_title_2')}</Text>
          <Text style={styles.stepDescription}>{stepTwoParams.issueType?.typeName || '--'}</Text>
        </View>

        {/* <View>
          <Text style={styles.stepSubtitle}>{t('step_3_field_title_2_1')}</Text>
          <Text style={styles.stepDescription}>{stepTwoParams.issueSubType?.name || '--'}</Text>
        </View> */}

        <View>
          <Text style={styles.stepSubtitle}>{t('step_3_field_title_3')}</Text>
          <Text style={styles.stepDescription}>{stepTwoParams.category?.categoryName || '--'}</Text>
        </View>

        {/* <View>
          <Text style={styles.stepSubtitle}>{t('step_3_field_title_5')}</Text>
          <Text style={styles.stepDescription}>{stepTwoParams.issueComponent?.name || '--'}</Text>
        </View> */}

        {/* <View>
          <Text style={styles.stepSubtitle}>{t('step_3_field_title_6')}</Text>
          <Text style={styles.stepDescription}>
            {stepTwoParams.issueSubComponent?.name || '--'}
          </Text>
        </View> */}

        <View>
          <Text style={styles.stepSubtitle}>{t('step_3_field_title_4')}</Text>
          <Text style={styles.stepDescription}>{stepTwoParams.additionalDetails || '--'}</Text>
        </View>

        <Text style={styles.stepSubtitle}>{t('step_3_attachments')}</Text>
        {stepTwoParams.attachments && stepTwoParams.attachments.length > 0 && (
          <Text style={styles.stepDescription}>
            Images: {stepTwoParams.attachments.length} file(s)
          </Text>
        )}
        {stepTwoParams.recordings && stepTwoParams.recordings.length > 0 && (
          <Text style={styles.stepDescription}>
            Audio: {stepTwoParams.recordings.length} recording(s)
          </Text>
        )}
      </View>

      <View style={{ paddingHorizontal: 50 }}>
        <Button
          theme={theme}
          style={{ alignSelf: 'center', margin: 24 }}
          labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
          mode="contained"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {t('submit_button_text')}
        </Button>
      </View>

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
                submitIssue();
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

// ✅ ADD: withObservables HOC at bottom of file
const enhance = withObservables([], () => ({
  // For displaying any lookup data if needed (categories, types, etc.)
  categories: watermelonManager.getDatabase().get('grm_issue_categories').query().observe(),
  types: watermelonManager.getDatabase().get('grm_issue_types').query().observe(),
  // Add other lookup tables if referenced in confirmation display
}));

export default enhance(Content);

import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, Text, View, Alert } from 'react-native';
import { Button, Dialog, Paragraph, Portal } from 'react-native-paper';
import { colors } from '../../../../utils/colors';
import dataManager from '../../../../services/DataManager';
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

function Content({ issue }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [showDialog, setShowDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const _hideDialog = () => setShowDialog(false);
  const _showDialog = () => setShowDialog(true);

  const randomWord = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const [sound, setSound] = useState();
  const [playing, setPlaying] = useState(false);

  const formatIssueData = () => {
    // Get user context
    const userContext = dataManager.getUserContext();

    // Get user assignment for the region
    const selectedRegionId = issue.issueLocation?.administrative_id || issue.issueLocation?.id;
    const regionAssignment = userContext?.assignments?.find(
      (a) => a.region.id === selectedRegionId
    );

    // Check if user has access to the selected region
    const hasRegionAccess = userContext?.accessible_regions?.some(
      (r) => r.name === selectedRegionId || r.id === selectedRegionId
    );

    // Check if category matches user's department in the region
    const isAssignable =
      regionAssignment &&
      issue.category?.id &&
      regionAssignment.department?.id === issue.category?.assigned_department;

    // Log assignment check data
    console.log('Assignment Check Debug:', {
      selectedRegion: {
        id: selectedRegionId,
        name: issue.issueLocation?.name,
      },
      userAssignments: userContext?.assignments?.map((a) => ({
        region: a.region.id,
        department: a.department.id,
      })),
      hasRegionAccess,
      regionAssignment: regionAssignment
        ? {
            region: regionAssignment.region.id,
            department: regionAssignment.department.id,
            role: regionAssignment.role,
          }
        : null,
      category: {
        id: issue.category?.id,
        assignedDepartment: issue.category?.assigned_department,
      },
      isAssignable,
      willAssign: isAssignable
        ? 'Yes - Will assign to current user'
        : 'No - Will create unassigned',
    });

    if (!hasRegionAccess) {
      console.warn('⚠️ User does not have access to selected region:', selectedRegionId);
    }

    // Format issue data according to centralized structure
    const formattedData = {
      // Basic fields
      description: issue.additionalDetails,

      // Citizen information
      citizen: issue.name || '',
      citizen_type: issue.citizen_type,
      gender: issue.gender,
      contact_medium: issue.typeOfPerson || 'facilitator',

      // Contact information
      contact_type: issue.methodOfContact || 'email',
      contact_value: issue.contactInfo || '',

      // Dates
      intake_date: new Date().toISOString(),
      issue_date: issue.date ? new Date(issue.date).toISOString() : new Date().toISOString(),

      // Required entities
      category: issue.category?.id || issue.category?.name,
      issue_type: issue.issueType?.id || issue.issueType?.name,
      administrative_region: selectedRegionId,

      // Optional entities
      citizen_age_group: issue.ageGroup?.id || issue.ageGroup?.name,
      citizen_group_1: issue.citizen_group_1?.id || issue.citizen_group_1?.name,
      citizen_group_2: issue.citizen_group_2?.id || issue.citizen_group_2?.name,

      // Project - get from user context if available
      project: regionAssignment?.project?.id || null,

      // Flags
      ongoing_issue: issue.ongoingEvent || false,
      confirmed: true,

      // Additional fields
      tracking_code: `${randomWord(SAMPLE_WORDS)}${Math.floor(Math.random() * 1000)}`,

      // Coordinates if available
      ...(issue.coordinates && {
        coordinates: JSON.stringify({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: [issue.coordinates.longitude, issue.coordinates.latitude],
              },
            },
          ],
        }),
      }),

      // Set assignee if user has matching department
      ...(isAssignable && { assignee: userContext.user.id }),
    };

    // Log final formatted data
    console.log('Formatted Issue Data:', {
      category: formattedData.category,
      issue_type: formattedData.issue_type,
      administrative_region: formattedData.administrative_region,
      project: formattedData.project,
      assignee: formattedData.assignee || 'Not assigned',
      assignment_reason: isAssignable
        ? 'Assigned to current user - matching department and region'
        : 'Left unassigned - no matching department or region assignment',
    });

    return formattedData;
  };

  const validateIssueData = (issueData) => {
    const requiredFields = {
      description: 'Description',
      category: 'Category',
      issue_type: 'Issue Type',
      administrative_region: 'Administrative Region',
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([field]) => !issueData[field])
      .map(([, label]) => label);

    if (missingFields.length > 0) {
      Alert.alert(
        t('error'),
        t('missing_required_fields', { fields: missingFields.join(', ') }),
        [{ text: t('ok'), style: 'default' }],
        { cancelable: true }
      );
      return false;
    }

    // Validate region access
    const userContext = dataManager.getUserContext();
    const hasRegionAccess = userContext?.accessible_regions?.some(
      (r) => r.name === issueData.administrative_region || r.id === issueData.administrative_region
    );

    if (!hasRegionAccess) {
      Alert.alert(t('error'), t('no_region_access'), [{ text: t('ok'), style: 'default' }], {
        cancelable: true,
      });
      return false;
    }

    return true;
  };

  const submitIssue = async () => {
    try {
      setIsSubmitting(true);

      // Format and validate issue data
      const issueData = formatIssueData();
      if (!validateIssueData(issueData)) {
        setIsSubmitting(false);
        return;
      }

      console.log('Submitting issue with data:', issueData);

      // Create issue using DataManager
      const response = await dataManager.createIssue(issueData);

      if (response.status === 'success' || response.status === 'pending') {
        // Handle attachments if any
        if (issue.attachment) {
          await dataManager.uploadAttachment(response.data._id, {
            file: issue.attachment.file,
            filename: issue.attachment.filename,
            description: issue.attachment.description,
          });
        }

        if (issue.recording) {
          await dataManager.uploadAttachment(response.data._id, {
            file: issue.recording.file,
            filename: issue.recording.filename,
            description: 'Voice recording',
          });
        }

        // Navigate to success screen
        navigation.navigate('CitizenReportStep4', {
          issue: response.data,
          pendingSync: response.status === 'pending',
        });
      } else {
        throw new Error(response.message || 'Failed to create issue');
      }
    } catch (error) {
      console.error('Error submitting issue:', error);
      Alert.alert(t('error'), t('issue_creation_error'), [{ text: t('ok'), style: 'default' }], {
        cancelable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (issue.category && issue.category.confidentiality_level === 'Confidential') {
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

      {/* STEP 3 SUMMARY */}
      <View style={styles.cardConfirm}>
        <View>
          <Text style={styles.stepSubtitle}>{t('step_3_field_title_1')}</Text>
          <Text style={styles.stepDescription}>
            {issue.date !== 'null' && !!issue.date
              ? moment(issue.date).format('DD-MMMM-YYYY')
              : '--'}
          </Text>
        </View>

        <View>
          <Text style={styles.stepSubtitle}>{t('step_3_field_title_2')}</Text>
          <Text style={styles.stepDescription}>{issue.issueType.name ?? '--'}</Text>
        </View>

        <View>
          <Text style={styles.stepSubtitle}>{t('step_3_field_title_2_1')}</Text>
          <Text style={styles.stepDescription}>{issue.issueSubType?.name ?? '--'}</Text>
        </View>

        <View>
          <Text style={styles.stepSubtitle}>{t('step_3_field_title_3')}</Text>
          <Text style={styles.stepDescription}>{issue.category?.name ?? '--'}</Text>
        </View>

        <View>
          <Text style={styles.stepSubtitle}>{t('step_3_field_title_5')}</Text>
          <Text style={styles.stepDescription}>{issue.issueComponent?.name ?? '--'}</Text>
        </View>

        <View>
          <Text style={styles.stepSubtitle}>{t('step_3_field_title_6')}</Text>
          <Text style={styles.stepDescription}>{issue.issueSubComponent?.name ?? '--'}</Text>
        </View>

        <View>
          <Text style={styles.stepSubtitle}>{t('step_3_field_title_4')}</Text>
          <Text style={styles.stepDescription}>{issue.additionalDetails ?? '--'}</Text>
        </View>

        <Text style={styles.stepSubtitle}>{t('step_3_attachments')}</Text>
        {issue.attachment && (
          <Text style={styles.stepDescription}>
            Image: {JSON.stringify(issue?.attachment?.id) ?? '--'}
          </Text>
        )}
        {issue.recording && (
          <Text style={styles.stepDescription}>
            Audio: {JSON.stringify(issue?.recording?.id) ?? '--'}
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

export default Content;

import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, Text, View } from 'react-native';
import { Button, Dialog, Paragraph, Portal } from 'react-native-paper';
import { colors } from '../../../../utils/colors';
import { createIssue as createIssueAPI } from '../../../../utils/databaseManager';
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

function Content({ issue, eadl }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [showDialog, setShowDialog] = useState(false);

  const _hideDialog = () => setShowDialog(false);
  const _showDialog = () => setShowDialog(true);
  // const incrementId = () => {
  //   const last = eadl.bp_projects[eadl.bp_projects.length - 1];
  //   if (!eadl.bp_projects[0]) return 1;
  //   return parseInt(last.id.split('-')[1]) + 1;
  // };
  const randomWord = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const [sound, setSound] = useState();
  const [playing, setPlaying] = useState(false);
  const submitIssue = () => {
    const isAssignee =
      issue.category?.assigned_department === eadl?.department &&
      issue.category?.administrative_level === eadl?.administrative_level;

    // Format issue data according to Frappe API requirements
    const _issue = {
      // Basic fields - remove title since app doesn't collect it
      description: issue.additionalDetails,

      // Citizen information
      citizen: issue.name ?? '',
      citizen_type: issue.citizen_type,
      gender: issue.gender,
      contact_medium: issue.typeOfPerson,

      // Contact information
      contact_information: {
        type: issue.methodOfContact,
        contact: issue.contactInfo,
      },

      // Dates
      intake_date: new Date().toISOString(),
      issue_date: issue.date ? new Date(issue.date).toISOString() : new Date().toISOString(),

      // Related entities - send IDs, not objects
      category: issue.category?.id || issue.category?.name,
      issue_type: issue.issueType?.id || issue.issueType?.name,
      administrative_region: issue.issueLocation?.administrative_id || issue.issueLocation?.id,
      citizen_age_group: issue.ageGroup?.id || issue.ageGroup?.name,
      citizen_group_1: issue.citizen_group_1?.id || issue.citizen_group_1?.name,
      citizen_group_2: issue.citizen_group_2?.id || issue.citizen_group_2?.name,

      // Project - if available
      project: eadl?.project || null,

      // Flags
      ongoing_issue: issue.ongoingEvent || false,
      confirmed: true,

      // Additional fields that might be needed
      tracking_code: `${randomWord(SAMPLE_WORDS)}${Math.floor(Math.random() * 1000)}`,
    };

    // Add geolocation coordinates if available
    if (issue.coordinates) {
      _issue.coordinates = `${issue.coordinates.latitude},${issue.coordinates.longitude}`;
    }

    // Add assignee if applicable (this will be handled by Frappe based on category)
    if (isAssignee && eadl?._id) {
      _issue.assignee = eadl._id;
    }

    // Remove any undefined or null values to avoid API issues
    Object.keys(_issue).forEach((key) => {
      if (_issue[key] === undefined || _issue[key] === null || _issue[key] === '') {
        delete _issue[key];
      }
    });

    console.log('Submitting issue with data:', _issue);

    createIssueAPI(_issue)
      .then((response) => {
        console.log('Issue created successfully:', response);
        navigation.navigate('CitizenReportStep4', { issue: response });
      })
      .catch((err) => {
        console.error('Error creating issue:', err);
        // Show error message to user
      });
  };

  const playSound = async (recordingUri) => {
    if (playing === false) {
      setPlaying(true);
      // console.log("Loading Sound");
      const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
      setSound(sound);
      // console.log("Playing Sound");
      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlaying(false);
        }
      });
    }
    // setPlaying(false)
  };

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
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();
  }, []);
  return (
    <ScrollView>
      <View style={{ padding: 23 }}>
        <Text style={styles.stepText}>{t('step_5')}</Text>
        <Text style={styles.stepSubtitle}>{t('step_3_confirmation')}</Text>
        <Text style={styles.stepDescription}>{t('step_3_subtitle')}</Text>
      </View>

      {/* STEP 3 SUMMARY */}
      <View style={styles.cardConfirm}>
        {/*
        <View style={{ flexDirection: 'row' }}>
          <Text style={styles.stepLittleText}>{t('step_3')}</Text>
          <IconButton icon={'pencil'} size={26} color={colors.primary}/>
        </View>
        */}
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
          onPress={() => {
            if (issue.category && issue.category.confidentiality_level === 'Confidential') {
              _showDialog();
              return;
            }
            submitIssue();
          }}
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

import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, Dialog, IconButton, Paragraph, Portal } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment';
import { i18n } from "../../../../translations/i18n";
import { colors } from '../../../../utils/colors';
import { styles } from './Content.styles';
import { useIssue } from '../../../../hooks/issues/useIssue';
import { useIssueAttachments } from '../../../../hooks/issues/useIssueAttachments';
import { showToast } from '../../../../utils/utils';

const SAMPLE_WORDS = ['lac', 'plaine', 'savane', 'colline'];
const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: '#dedede',
    text: '#707070',
  },
}

function Content({ issue, session, profile }) {
  const navigation = useNavigation();
  const [showDialog, setShowDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { createIssue } = useIssue(false);
  const { createAttachment } = useIssueAttachments();

  const _hideDialog = () => setShowDialog(false);
  const _showDialog = () => setShowDialog(true);
  // const incrementId = () => {
  //   const last = eadl.bp_projects[eadl.bp_projects.length - 1];
  //   if (!eadl.bp_projects[0]) return 1;
  //   return parseInt(last.id.split('-')[1]) + 1;
  // };
  const randomWord = (arr) => arr[Math.floor(Math.random() * arr.length)];
  
  const submitIssue = async () =>
  {  
    
    const randomCodeNumber = Math.floor(Math.random() * 1000);
    const _issue = {
      tracking_code: `${randomWord(SAMPLE_WORDS)}${randomCodeNumber}`,
      title: issue.issueSummary,
      description: issue.additionalDetails,
      attachments: [
        ...(issue?.attachment ? [issue.attachment] : []),
        ...(issue?.recording ? [issue.recording] : []),
      ],
      status: issue.status,
      reporter: { id: session.user_id, name: profile?.user?.name },
      // citizen_age_group: issue.ageGroup,
      // citizen: issue.name ?? '',
      citizen: {
        name: issue.name ?? '',
        age_group: issue.ageGroup,
        type: issue.citizen_type,
        group: issue.citizen_group,
        group_2: issue.citizen_group_2,
      },
      contact_medium: issue.typeOfPerson,
      citizen_type: issue.citizen_type,
      citizen_group: issue.citizen_group,
      citizen_group_2: issue.citizen_group_2,
      location_description: issue.locationDescription, //e.g. pasó en la esquina de la calle frank 19
      administrative_region: issue.issueLocation,
      category: issue.category,
      issue_type: issue.issueType,
      issue_sub_type: issue.issueSubType,
      component: issue.issueComponent,
      sub_component: issue.issueSubComponent,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      resolution_days: 0,
      resolution_date: '',
      intake_date: issue.date,
      ongoing_issue: issue.ongoingEvent,
      comments: [],
      contact_method: issue.methodOfContact,
      contact_information: issue.contactInfo,
    };

    setSubmitting(true);
    const createdIssue = await createIssue(_issue);
    
    const attachments = [
      ...(issue?.attachment ? [issue.attachment] : []),
      ...(issue?.recording ? [issue.recording] : []),
    ];
    
    
    if (attachments) {
      for (let index = 0; index < attachments.length; index++) {
        const element = attachments[index];
        
         await createAttachment({
           file_name: element.name,
           is_audio: element.isAudio,
           local_url: element.local_url,
           url: '',
           parent_id: createdIssue.id,
           id: '',
           created_date: '',
           name: element.name,
         });
      }
    }
    setSubmitting(false);
    if (createdIssue) {
      navigation.navigate('CitizenReportStep4', { issue: _issue });
    } else { 
      showToast(`Issue creation failed. Please try again later.`)
      console.error('Issue creation failed');
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

  return (
    <ScrollView>
      <View style={{ padding: 23 }}>
        <Text style={styles.stepText}>{i18n.t('step_5')}</Text>
        <Text style={styles.stepSubtitle}>{i18n.t('step_3_confirmation')}</Text>
        <Text style={styles.stepDescription}>{i18n.t('step_3_subtitle')}</Text>
      </View>

      {/* STEP 3 SUMMARY */}
      <View style={styles.cardConfirm}>
        {/*
        <View style={{ flexDirection: 'row' }}>
          <Text style={styles.stepLittleText}>{i18n.t('step_3')}</Text>
          <IconButton icon={'pencil'} size={26} color={colors.primary}/>
        </View>
        */}
        <View>
          <Text style={styles.stepSubtitle}>{i18n.t('step_3_field_title_1')}</Text>
          <Text style={styles.stepDescription}>
            {issue.date !== 'null' && !!issue.date
              ? moment(issue.date).format('DD-MMMM-YYYY')
              : '--'}
          </Text>
        </View>

        <View>
          <Text style={styles.stepSubtitle}>{i18n.t('step_3_field_title_2')}</Text>
          <Text style={styles.stepDescription}>{issue.issueType.name ?? '--'}</Text>
        </View>

        <View>
          <Text style={styles.stepSubtitle}>{i18n.t('step_3_field_title_2_1')}</Text>
          <Text style={styles.stepDescription}>{issue.issueSubType?.name ?? '--'}</Text>
        </View>

        <View>
          <Text style={styles.stepSubtitle}>{i18n.t('step_3_field_title_3')}</Text>
          <Text style={styles.stepDescription}>{issue.category?.name ?? '--'}</Text>
        </View>

        <View>
          <Text style={styles.stepSubtitle}>{i18n.t('step_3_field_title_5')}</Text>
          <Text style={styles.stepDescription}>{issue.issueComponent?.name ?? '--'}</Text>
        </View>

        {/* <View>
          <Text style={styles.stepSubtitle}>{i18n.t('step_3_field_title_7')}</Text>
          <Text style={styles.stepDescription}>{issues.citizen_group?.name ?? '--'}</Text>
        </View> */}

        {/* <View>
          <Text style={styles.stepSubtitle}>{i18n.t('step_3_field_title_6')}</Text>
          <Text style={styles.stepDescription}>{issues.issueSubComponent?.name ?? '--'}</Text>
        </View> */}

        <View>
          <Text style={styles.stepSubtitle}>{i18n.t('step_3_field_title_4')}</Text>
          <Text style={styles.stepDescription}>{issue.additionalDetails ?? '--'}</Text>
        </View>

        <Text style={styles.stepSubtitle}>{i18n.t('step_3_attachments')}</Text>
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
          loading={submitting}
          disabled={submitting}
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
          {i18n.t('submit_button_text')}
        </Button>
      </View>

      <Portal>
        <Dialog visible={showDialog} onDismiss={_hideDialog}>
          <Dialog.Title>{i18n.t('warning')}</Dialog.Title>
          <Dialog.Content>
            <Paragraph>{i18n.t('confidential_complaint')}</Paragraph>
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
                submitIssue();
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
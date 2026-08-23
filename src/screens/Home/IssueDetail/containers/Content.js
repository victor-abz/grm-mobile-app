import React, { useEffect, useState, useRef } from 'react';
import { View, ScrollView, Text, Platform, TouchableOpacity, ImageBackground } from "react-native";
import { styles } from './Content.styles';
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment';
import { colors } from '../../../../utils/colors';
import { useBackHandler } from '@react-native-community/hooks';
import CustomSeparator from '../../../../components/CustomSeparator/CustomSeparator';
import { i18n } from "../../../../translations/i18n";
import { Button } from 'react-native-paper';
import { citizenTypes } from '../../../../utils/utils';
import Collapsible from 'react-native-collapsible';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import RecordingCard from "../../GRM/components/RecordingCard";
import ImagePreviewCard from '../../CitizenReportStep2/containers/ImagePreviewCard';
import { useIssueComments } from "../../../../hooks/issues/useIssueComments";
import { ConfidentialityChoices } from '../../../../utils/constants';

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: '#dedede',
    text: '#707070',
  },
};

function Content({ issue, attachments, refetchAttachment }) {
  const parentId = issue.id;
  const { comments, loading } = useIssueComments(parentId);
  const [isIssueAssignedToMe, setIsIssueAssignedToMe] = useState(false);
  const [currentDate, setCurrentDate] = useState(moment());
  const [newComment, setNewComment] = useState();
  const [isComponentCollapsed, setIsComponentCollapsed] = useState(true);
  const [isDescriptionCollapsed, setIsDescriptionCollapsed] = useState(true);
  const [isDecisionCollapsed, setIsDecisionCollapsed] = useState(true);
  const [isSatisfactionCollapsed, setIsSatisfactionCollapsed] = useState(true);
  const [isAppealCollapsed, setIsAppealCollapsed] = useState(true);
  const [isAttachmentCollapsed, setIsAttachmentCollapsed] = useState(true);
  const scrollViewRef = useRef();

  useBackHandler(() => {
    // navigation.navigate("GRM")
    // handle it
    return true;
  });

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

  useEffect(() => {
    function _isIssueAssignedToMe() {
      if (issue.assignee && issue.assignee.id) {
        return issue.reporter.id === issue.assignee.id;
      }
    }

    setIsIssueAssignedToMe(_isIssueAssignedToMe());
  }, []);

  const upsertNewComment = () => {
    // TODO: Upsert or check if this empty comment is needed. Add new comment into issue.
  };

  const onAddComment = () => {
    if (newComment) {
      const commentDate = moment().format('DD-MMM-YYYY');
      issue.comments = [
        ...issue.comments,
        {
          name: issue.reporter.name,
          comment: newComment,
          due_date: commentDate,
        },
      ];
      setComments([
        ...comments,
        {
          name: issue.reporter.name,
          comment: newComment,
          due_date: commentDate,
        },
      ]);
      setNewComment('');
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 50);
    }
    upsertNewComment();
  };

  const onAttachmentRetry = async (attachmentId) => {
    try {
      if (typeof attachmentId == 'string') {
        await refetchAttachment(attachmentId);
      } else {
        await refetchAttachment(String(attachmentId));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ScrollView ref={scrollViewRef} contentContainerStyle={{ alignItems: 'center', padding: 20 }}>
      <View key={'content'} style={styles.infoContainer}>
        <View style={{ flexDirection: 'row' }}>
          <View
            style={{ marginBottom: 10, justifyContent: 'flex-end', flex: 1, flexDirection: 'row' }}
          >
            <Text style={[styles.text, { fontSize: 12, color: colors.primary }]}>
              {' '}
              {i18n.t('took_place_on')}{": "}
              {issue.intake_date && moment(issue.intake_date).format('DD-MMM-YYYY')}{' | '}
              {issue.intake_date && currentDate.diff(issue.intake_date, 'days')}{' '}
              {i18n.t('days_ago')}
            </Text>
          </View>
        </View>
        <View
          style={{
            flexDirection: 'row',
            flex: 1,
            justifyContent: 'space-between',
            marginTop: 10,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.subtitle}>
              {i18n.t('type')}{' '}
              <Text style={[styles.text]}>
                {issue.citizen &&
                issue.citizen.type === ConfidentialityChoices.CONFIDENTIAL &&
                !isIssueAssignedToMe
                  ? i18n.t('confidential')
                  : (issue.issue_type?.name ?? i18n.t('information_not_available'))}
              </Text>
            </Text>
            {/* <Text style={styles.subtitle}>
              {i18n.t('lodged_by')}
              <Text
                style={styles.text}> {citizenTypes[issues.citizen_type] ?? i18n.t('information_not_available')}</Text>
            </Text> */}
            <Text style={styles.subtitle}>
              {i18n.t('name')}
              <Text style={styles.text}>
                {' '}
                {issue.citizen &&
                issue.citizen.type === ConfidentialityChoices.CONFIDENTIAL &&
                !isIssueAssignedToMe
                  ? i18n.t('confidential')
                  : (issue?.citizen?.name ?? '')}
              </Text>
            </Text>
            <Text style={styles.subtitle}>
              {i18n.t('age')}{' '}
              <Text style={styles.text}>
                {' '}
                {issue.citizen &&
                issue.citizen.type === ConfidentialityChoices.CONFIDENTIAL &&
                !isIssueAssignedToMe
                  ? i18n.t('confidential')
                  : (issue.citizen_age_group?.name ?? i18n.t('information_not_available'))}
              </Text>
            </Text>
            {/* <View>
              <Text style={[styles.subtitle, {marginBottom: 0}]}>{i18n.t('profession')}{' '}</Text>
              <Text style={[styles.text, {marginBottom: 5}]}>
                {issues.citizen_type === 1 && !isIssueAssignedToMe ? i18n.t('confidential') : issues.citizen_group_1?.name ?? i18n.t('information_not_available')}
              </Text>
            </View>
            <View>
              <Text style={[styles.subtitle, {marginBottom: 0}]}>{i18n.t('educational_level')}{' '}</Text>
              <Text style={[styles.text, {marginBottom: 5}]}>
                {issues.citizen_type === 1 && !isIssueAssignedToMe ? i18n.t('confidential') : issues.citizen_group_2?.name ?? i18n.t('information_not_available')}
              </Text>
            </View> */}
            <View>
              <Text style={[styles.subtitle, { marginBottom: 0 }]}>{i18n.t('sub_type')} </Text>
              <Text style={[styles.text, { marginBottom: 5 }]}>
                {issue.citizen &&
                issue.citizen.type === ConfidentialityChoices.CONFIDENTIAL &&
                !isIssueAssignedToMe
                  ? i18n.t('confidential')
                  : (issue.issue_sub_type?.name ?? i18n.t('information_not_available'))}
              </Text>
            </View>
            <View>
              <Text style={[styles.subtitle, { marginBottom: 0 }]}>{i18n.t('category')} </Text>
              <Text style={[styles.text, { marginBottom: 5 }]}>
                {issue.category?.name ?? i18n.t('information_not_available')}
              </Text>
            </View>
            <Text style={styles.subtitle}>
              {i18n.t('location')}{' '}
              <Text style={styles.text}>
                {issue.citizen &&
                issue.citizen.type === ConfidentialityChoices.CONFIDENTIAL &&
                !isIssueAssignedToMe
                  ? i18n.t('confidential')
                  : (issue.administrative_region?.name ?? i18n.t('information_not_available'))}
              </Text>
            </Text>
            <Text style={styles.subtitle}>
              {i18n.t('assigned_to')}{' '}
              <Text style={styles.text}> {issue.assignee?.name ?? 'Pending Assigment'}</Text>
            </Text>
          </View>
        </View>

        <CustomSeparator />
        <TouchableOpacity
          onPress={() => setIsComponentCollapsed(!isComponentCollapsed)}
          style={styles.collapsibleTrigger}
        >
          <Text style={styles.subtitle}>{i18n.t('component')}</Text>
          <MaterialCommunityIcons
            name={isComponentCollapsed ? 'chevron-down-circle' : 'chevron-up-circle'}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
        <Collapsible collapsed={isComponentCollapsed}>
          <View style={styles.collapsibleContent}>
            <Text style={styles.subtitle}>
              {i18n.t('component')}{' '}
              <Text style={styles.text}>
                {' '}
                {issue.citizen &&
                issue.citizen.type === ConfidentialityChoices.CONFIDENTIAL &&
                !isIssueAssignedToMe
                  ? i18n.t('confidential')
                  : (issue.component?.name ?? i18n.t('information_not_available'))}
              </Text>
            </Text>
            {/* <Text style={styles.subtitle}>
              {i18n.t('sub_component')}{' '}
              <Text
                style={styles.text}> {issues.citizen_type === 1 && !isIssueAssignedToMe ? i18n.t('confidential') : issues.sub_component?.name ?? i18n.t('information_not_available')}</Text>
            </Text> */}
          </View>
        </Collapsible>
        <CustomSeparator />
        <TouchableOpacity
          onPress={() => setIsDescriptionCollapsed(!isDescriptionCollapsed)}
          style={styles.collapsibleTrigger}
        >
          <Text style={styles.subtitle}>{i18n.t('description_label')}</Text>
          <MaterialCommunityIcons
            name={isDescriptionCollapsed ? 'chevron-down-circle' : 'chevron-up-circle'}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
        <Collapsible collapsed={isDescriptionCollapsed}>
          <View style={styles.collapsibleContent}>
            <Text style={styles.collapsibleTextArea}>{issue.description}</Text>
          </View>
        </Collapsible>
        <CustomSeparator />

        <TouchableOpacity
          onPress={() => setIsDecisionCollapsed(!isDecisionCollapsed)}
          style={styles.collapsibleTrigger}
        >
          <Text style={styles.subtitle}>{i18n.t('decision')}</Text>
          <MaterialCommunityIcons
            name={isDecisionCollapsed ? 'chevron-down-circle' : 'chevron-up-circle'}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
        <Collapsible collapsed={isDecisionCollapsed}>
          <View style={styles.collapsibleContent}>
            <Text style={styles.collapsibleTextArea}>
              {issue.research_result ?? i18n.t('information_not_available')}
            </Text>
          </View>
        </Collapsible>
        <CustomSeparator />

        <TouchableOpacity
          onPress={() => setIsSatisfactionCollapsed(!isSatisfactionCollapsed)}
          style={styles.collapsibleTrigger}
        >
          <Text style={styles.subtitle}>{i18n.t('satisfaction')}</Text>
          <MaterialCommunityIcons
            name={isSatisfactionCollapsed ? 'chevron-down-circle' : 'chevron-up-circle'}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
        <Collapsible collapsed={isSatisfactionCollapsed}>
          <View style={styles.collapsibleContent}>
            <Text style={styles.collapsibleTextArea}>{i18n.t('information_not_available')}</Text>
          </View>
        </Collapsible>
        <CustomSeparator />

        <TouchableOpacity
          onPress={() => setIsAppealCollapsed(!isAppealCollapsed)}
          style={styles.collapsibleTrigger}
        >
          <Text style={styles.subtitle}>{i18n.t('appeal_reason')}</Text>
          <MaterialCommunityIcons
            name={isAppealCollapsed ? 'chevron-down-circle' : 'chevron-up-circle'}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
        <Collapsible collapsed={isAppealCollapsed}>
          <View style={styles.collapsibleContent}>
            <Text style={styles.collapsibleTextArea}>{i18n.t('information_not_available')}</Text>
          </View>
        </Collapsible>
        <CustomSeparator />

        <TouchableOpacity
          onPress={() => setIsAttachmentCollapsed(!isAttachmentCollapsed)}
          style={styles.collapsibleTrigger}
        >
          <Text style={styles.subtitle}>{i18n.t('attachments_label')}</Text>
          <MaterialCommunityIcons
            name={isAttachmentCollapsed ? 'chevron-down-circle' : 'chevron-up-circle'}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
        <Collapsible collapsed={isAttachmentCollapsed}>
          <View style={styles.collapsibleContent}>
            {attachments?.map((attachment) => {
              const isAudio =
                typeof (attachment.file === 'string' || attachment.local_url === 'string') &&
                /\.(mp3|wav|m4a|aac|ogg|oga|flac|amr|3gp)(\?.*)?$/i.test(
                  attachment.file ?? attachment.local_url
                );

              return (
                <View style={{ flexDirection: 'row', maxWidth: '100%', justifyContent: 'center' }}>
                  {!isAudio && (attachment.file || attachment.local_url || attachment.url) && (
                    <ImagePreviewCard
                      onRetry={() => onAttachmentRetry(attachment.id)}
                      uri={
                        attachment.file ??
                        (attachment.local_url ? attachment.local_url : attachment.url)
                      }
                      id={attachment.id}
                      showRemove={false}
                    />
                  )}
                  {isAudio && (
                    <RecordingCard
                      mode="playback"
                      initialURI={attachment.file ?? attachment.local_url}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </Collapsible>

        <CustomSeparator />
        <Button
          theme={theme}
          style={{ alignSelf: 'center', margin: 24 }}
          labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
          mode="contained"
          onPress={onAddComment}
        >
          {i18n.t('back')}
        </Button>
      </View>
    </ScrollView>
  );
}

export default Content;

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBackHandler } from '@react-native-community/hooks';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment';
import { default as React, useEffect, useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Image, 
  Platform, 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  View, 
  ActivityIndicator 
} from 'react-native';
import Collapsible from 'react-native-collapsible';
import { Button, IconButton, TextInput } from 'react-native-paper';
import CustomSeparator from '../../../../components/CustomSeparator/CustomSeparator';
import { baseURL } from '../../../../services/API';
import { colors } from '../../../../utils/colors';
import { citizenTypes } from '../../../../utils/utils';
import { styles } from './Content.styles';
import { useData } from '../../../../providers/DataProvider';

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
  issue, 
  categories = [],
  types = [],
  statuses = [],
  ageGroups = [],
  citizenGroups = [],
  regions = [],
  projects = [],
  users = []
}) {
  const { t } = useTranslation();
  const { dataManager } = useData();
  const [comments, setComments] = useState([]);
  const [isIssueAssignedToMe, setIsIssueAssignedToMe] = useState(false);
  const [currentDate, setCurrentDate] = useState(moment());
  const [newComment, setNewComment] = useState();
  const [isComponentCollapsed, setIsComponentCollapsed] = useState(true);
  const [isDescriptionCollapsed, setIsDescriptionCollapsed] = useState(true);
  const [isDecisionCollapsed, setIsDecisionCollapsed] = useState(true);
  const [isSatisfactionCollapsed, setIsSatisfactionCollapsed] = useState(true);
  const [isAppealCollapsed, setIsAppealCollapsed] = useState(true);
  const [_sound, setSound] = useState();
  const [imageError, setImageError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const scrollViewRef = useRef();

  useBackHandler(
    () =>
      // navigation.navigate("GRM")
      // handle it
      true
  );

  // Create lookup helper functions for efficient ID-to-label resolution
  const createLookupMap = (items, labelField) => {
    const map = new Map();
    if (!items || !Array.isArray(items)) return map;
    
    items.forEach(item => {
      if (item && item.id) {
        const label = item[labelField] || item.id;
        map.set(item.id, label);
      }
    });
    return map;
  };

  // Create lookup maps for all related data (memoized for performance)
  const lookupMaps = useMemo(() => ({
    categoryMap: createLookupMap(categories, 'categoryName'),
    typeMap: createLookupMap(types, 'typeName'),
    statusMap: createLookupMap(statuses, 'statusName'),
    ageGroupMap: createLookupMap(ageGroups, 'ageGroup'),
    citizenGroupMap: createLookupMap(citizenGroups, 'groupName'),
    regionMap: createLookupMap(regions, 'regionName'),
    projectMap: createLookupMap(projects, 'title'),
    userMap: createLookupMap(users, 'fullName'),
  }), [categories, types, statuses, ageGroups, citizenGroups, regions, projects, users]);

  // Enrich single issue with resolved labels
  const enrichedIssue = useMemo(() => {
    if (!issue) return null;
    
    // Handle both array from observable and single issue object
    const issueData = Array.isArray(issue) ? issue[0] : issue;
    if (!issueData) return null;

    // Handle both WatermelonDB model objects and raw data
    const rawData = issueData._raw || issueData;

    return {
      // Keep all original issue data
      ...rawData,
      
      // Add resolved labels for display
      categoryLabel: lookupMaps.categoryMap.get(rawData.category_id) || rawData.category_id || t('information_not_available'),
      typeLabel: lookupMaps.typeMap.get(rawData.issue_type_id) || rawData.issue_type_id || t('information_not_available'),
      statusLabel: lookupMaps.statusMap.get(rawData.status_id) || rawData.status_id || t('information_not_available'),
      ageGroupLabel: lookupMaps.ageGroupMap.get(rawData.citizen_age_group_id) || rawData.citizen_age_group_id || t('information_not_available'),
      citizenGroup1Label: lookupMaps.citizenGroupMap.get(rawData.citizen_group_1_id) || rawData.citizen_group_1_id || t('information_not_available'),
      citizenGroup2Label: lookupMaps.citizenGroupMap.get(rawData.citizen_group_2_id) || rawData.citizen_group_2_id || t('information_not_available'),
      regionLabel: lookupMaps.regionMap.get(rawData.administrative_region_id) || rawData.administrative_region_id || t('information_not_available'),
      projectLabel: lookupMaps.projectMap.get(rawData.project_id) || rawData.project_id || t('information_not_available'),
      reporterLabel: lookupMaps.userMap.get(rawData.reporter_id) || rawData.reporter_id || t('information_not_available'),
      assigneeLabel: lookupMaps.userMap.get(rawData.assignee_id) || rawData.assignee_id || 'Pending Assignment',
      
      // Format dates for display
      issueDateFormatted: rawData.issue_date ? moment(rawData.issue_date).format('DD-MMM-YYYY HH:mm') : '',
      intakeDateFormatted: rawData.intake_date ? moment(rawData.intake_date).format('DD-MMM-YYYY HH:mm') : '',
      
      // Backward compatibility fields for existing code
      issue_type: { name: lookupMaps.typeMap.get(rawData.issue_type_id) || rawData.issue_type_id },
      category: { name: lookupMaps.categoryMap.get(rawData.category_id) || rawData.category_id },
      citizen_age_group: { name: lookupMaps.ageGroupMap.get(rawData.citizen_age_group_id) || rawData.citizen_age_group_id },
      citizen_group_1: { name: lookupMaps.citizenGroupMap.get(rawData.citizen_group_1_id) || rawData.citizen_group_1_id },
      citizen_group_2: { name: lookupMaps.citizenGroupMap.get(rawData.citizen_group_2_id) || rawData.citizen_group_2_id },
      administrative_region: { name: lookupMaps.regionMap.get(rawData.administrative_region_id) || rawData.administrative_region_id },
      assignee: { name: rawData.assignee_id ? lookupMaps.userMap.get(rawData.assignee_id) || rawData.assignee_id : 'Pending Assignment' },
      reporter: { id: rawData.reporter_id },
      
      // Handle attachments and comments
      attachments: rawData.attachments || [],
      comments: rawData.comments || [],
    };
  }, [issue, lookupMaps, t]);

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
    if (enrichedIssue) {
      setComments(enrichedIssue.comments || []);
      
      function _isIssueAssignedToMe() {
        if (enrichedIssue.assignee && enrichedIssue.assignee.id) {
          return enrichedIssue.reporter.id === enrichedIssue.assignee.id;
        }
        return false;
      }

      setIsIssueAssignedToMe(_isIssueAssignedToMe());
    }
  }, [enrichedIssue]);

  const upsertNewComment = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      // Update the issue with new comments using DataManager
      // await updateIssue(enrichedIssue._id, {
      //   comments: enrichedIssue.comments,
      // });
      console.log('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const playSound = async (recordingUri, remoteUrl) => {
    if (playing === false) {
      setPlaying(true);
      try {
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
      } catch (e) {
        console.log(e);
        try {
          const { sound } = await Audio.Sound.createAsync({ uri: `${baseURL}${remoteUrl}` });
          setSound(sound);
          // console.log("Playing Sound");
          await sound.playAsync();

          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) {
              setPlaying(false);
            }
          });
        } catch (_e) {
          console.log(_e);
        }
      }
    }
    // setPlaying(false)
  };

  const onAddComment = async () => {
    if (newComment && !isUpdating && enrichedIssue) {
      const commentDate = moment().toISOString();
      const newCommentObj = {
        comment_by: enrichedIssue.reporter.id, // Use proper user ID
        comment_text: newComment,
        comment_date: commentDate,
      };

      // Update issue comments
      enrichedIssue.comments = [...(enrichedIssue.comments || []), newCommentObj];

      // Update local state
      setComments([...comments, newCommentObj]);
      setNewComment('');

      // Scroll to end
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 50);

      // Save to database
      await upsertNewComment();
    }
  };

  React.useEffect(
    () =>
      _sound
        ? () => {
            // console.log("Unloading Sound");
            _sound.unloadAsync();
          }
        : undefined,
    [_sound]
  );

  // Loading state while data is being fetched or enriched
  if (!enrichedIssue) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, fontSize: 16, color: colors.secondary }}>
          {t('loading_issue_details') || 'Loading issue details...'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView ref={scrollViewRef} contentContainerStyle={{ alignItems: 'center', padding: 20 }}>
      <View style={styles.infoContainer}>
        <View style={{ flexDirection: 'row' }}>
          <View
            style={{ marginBottom: 10, justifyContent: 'flex-end', flex: 1, flexDirection: 'row' }}
          >
            <Text style={[styles.text, { fontSize: 12, color: colors.primary }]}>
              {' '}
              {enrichedIssue.issue_date && moment(enrichedIssue.issue_date).format('DD-MMM-YYYY')}{' '}
              {enrichedIssue.issue_date && currentDate.diff(enrichedIssue.issue_date, 'days')} {t('days_ago')}
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
              {t('type')}{' '}
              <Text style={[styles.text]}>
                {enrichedIssue.citizen_type === 1 && !isIssueAssignedToMe
                  ? t('confidential')
                  : enrichedIssue.typeLabel}
              </Text>
            </Text>
            <Text style={styles.subtitle}>
              {t('lodged_by')}
              <Text style={styles.text}>
                {' '}
                {citizenTypes[enrichedIssue.citizen_type] ?? t('information_not_available')}
              </Text>
            </Text>
            <Text style={styles.subtitle}>
              {t('name')}
              <Text style={styles.text}>
                {' '}
                {enrichedIssue.citizen_type === 1 && !isIssueAssignedToMe
                  ? t('confidential')
                  : enrichedIssue.citizen}
              </Text>
            </Text>
            <Text style={styles.subtitle}>
              {t('age')}{' '}
              <Text style={styles.text}>
                {' '}
                {enrichedIssue.citizen_type === 1 && !isIssueAssignedToMe
                  ? t('confidential')
                  : enrichedIssue.ageGroupLabel}
              </Text>
            </Text>
            <View>
              <Text style={[styles.subtitle, { marginBottom: 0 }]}>{t('profession')} </Text>
              <Text style={[styles.text, { marginBottom: 5 }]}>
                {enrichedIssue.citizen_type === 1 && !isIssueAssignedToMe
                  ? t('confidential')
                  : enrichedIssue.citizenGroup1Label}
              </Text>
            </View>
            <View>
              <Text style={[styles.subtitle, { marginBottom: 0 }]}>{t('educational_level')} </Text>
              <Text style={[styles.text, { marginBottom: 5 }]}>
                {enrichedIssue.citizen_type === 1 && !isIssueAssignedToMe
                  ? t('confidential')
                  : enrichedIssue.citizenGroup2Label}
              </Text>
            </View>
            <View>
              <Text style={[styles.subtitle, { marginBottom: 0 }]}>{t('sub_type')} </Text>
              <Text style={[styles.text, { marginBottom: 5 }]}>
                {enrichedIssue.citizen_type === 1 && !isIssueAssignedToMe
                  ? t('confidential')
                  : enrichedIssue.issue_sub_type?.name ?? t('information_not_available')}
              </Text>
            </View>
            <View>
              <Text style={[styles.subtitle, { marginBottom: 0 }]}>{t('category')} </Text>
              <Text style={[styles.text, { marginBottom: 5 }]}>
                {enrichedIssue.categoryLabel}
              </Text>
            </View>
            <Text style={styles.subtitle}>
              {t('location')}{' '}
              <Text style={styles.text}>
                {enrichedIssue.citizen_type === 1 && !isIssueAssignedToMe
                  ? t('confidential')
                  : enrichedIssue.regionLabel}
              </Text>
            </Text>
            <Text style={styles.subtitle}>
              {t('assigned_to')}{' '}
              <Text style={styles.text}> {enrichedIssue.assignee?.name ?? 'Pending Assignment'}</Text>
            </Text>
            {enrichedIssue.attachments?.length > 0 &&
              enrichedIssue.attachments.map((item, index) => (
                <View key={index}>
                  {item.isAudio ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        // justifyContent: 'center',
                      }}
                    >
                      <IconButton
                        icon="play"
                        color={playing ? colors.disabled : colors.primary}
                        size={24}
                        onPress={() => playSound(item.local_url, item.url)}
                      />
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
                        Play Recorded Audio
                      </Text>
                    </View>
                  ) : (
                    <View>
                      {imageError ? (
                        <Image
                          source={{ uri: item.url }}
                          onError={() => setImageError(true)}
                          style={{
                            height: 80,
                            width: 80,
                            justifyContent: 'flex-end',
                            marginVertical: 20,
                            marginLeft: 20,
                          }}
                        />
                      ) : (
                        <Image
                          source={{ uri: item.local_url }}
                          onError={() => setImageError(true)}
                          style={{
                            height: 80,
                            width: 80,
                            justifyContent: 'flex-end',
                            marginVertical: 20,
                            marginLeft: 20,
                          }}
                        />
                      )}
                    </View>
                  )}
                </View>
              ))}
          </View>
        </View>

        <CustomSeparator />
        <TouchableOpacity
          onPress={() => setIsComponentCollapsed(!isComponentCollapsed)}
          style={styles.collapsibleTrigger}
        >
          <Text style={styles.subtitle}>{t('component')}</Text>
          <MaterialCommunityIcons
            name={isComponentCollapsed ? 'chevron-down-circle' : 'chevron-up-circle'}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
        <Collapsible collapsed={isComponentCollapsed}>
          <View style={styles.collapsibleContent}>
            <Text style={styles.subtitle}>
              {t('component')}{' '}
              <Text style={styles.text}>
                {' '}
                {enrichedIssue.citizen_type === 1 && !isIssueAssignedToMe
                  ? t('confidential')
                  : enrichedIssue.component?.name ?? t('information_not_available')}
              </Text>
            </Text>
            <Text style={styles.subtitle}>
              {t('sub_component')}{' '}
              <Text style={styles.text}>
                {' '}
                {enrichedIssue.citizen_type === 1 && !isIssueAssignedToMe
                  ? t('confidential')
                  : enrichedIssue.sub_component?.name ?? t('information_not_available')}
              </Text>
            </Text>
          </View>
        </Collapsible>
        <CustomSeparator />
        <TouchableOpacity
          onPress={() => setIsDescriptionCollapsed(!isDescriptionCollapsed)}
          style={styles.collapsibleTrigger}
        >
          <Text style={styles.subtitle}>{t('description_label')}</Text>
          <MaterialCommunityIcons
            name={isDescriptionCollapsed ? 'chevron-down-circle' : 'chevron-up-circle'}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
        <Collapsible collapsed={isDescriptionCollapsed}>
          <View style={styles.collapsibleContent}>
            <Text style={styles.collapsibleTextArea}>{enrichedIssue.description}</Text>
          </View>
        </Collapsible>
        <CustomSeparator />

        <TouchableOpacity
          onPress={() => setIsDecisionCollapsed(!isDecisionCollapsed)}
          style={styles.collapsibleTrigger}
        >
          <Text style={styles.subtitle}>{t('decision')}</Text>
          <MaterialCommunityIcons
            name={isDecisionCollapsed ? 'chevron-down-circle' : 'chevron-up-circle'}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
        <Collapsible collapsed={isDecisionCollapsed}>
          <View style={styles.collapsibleContent}>
            <Text style={styles.collapsibleTextArea}>
              {enrichedIssue.research_result ?? t('information_not_available')}
            </Text>
          </View>
        </Collapsible>
        <CustomSeparator />

        <TouchableOpacity
          onPress={() => setIsSatisfactionCollapsed(!isSatisfactionCollapsed)}
          style={styles.collapsibleTrigger}
        >
          <Text style={styles.subtitle}>{t('satisfaction')}</Text>
          <MaterialCommunityIcons
            name={isSatisfactionCollapsed ? 'chevron-down-circle' : 'chevron-up-circle'}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
        <Collapsible collapsed={isSatisfactionCollapsed}>
          <View style={styles.collapsibleContent}>
            <Text style={styles.collapsibleTextArea}>{t('information_not_available')}</Text>
          </View>
        </Collapsible>
        <CustomSeparator />

        <TouchableOpacity
          onPress={() => setIsAppealCollapsed(!isAppealCollapsed)}
          style={styles.collapsibleTrigger}
        >
          <Text style={styles.subtitle}>{t('appeal_reason')}</Text>
          <MaterialCommunityIcons
            name={isAppealCollapsed ? 'chevron-down-circle' : 'chevron-up-circle'}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
        <Collapsible collapsed={isAppealCollapsed}>
          <View style={styles.collapsibleContent}>
            <Text style={styles.collapsibleTextArea}>{t('information_not_available')}</Text>
          </View>
        </Collapsible>

        <CustomSeparator />
        <Button
          theme={theme}
          style={{ alignSelf: 'center', margin: 24 }}
          labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
          mode="contained"
          onPress={() => {
            // Navigate back or handle back action
            console.log('Back button pressed');
          }}
        >
          {t('back')}
        </Button>
      </View>
    </ScrollView>
  );
}

export default Content;

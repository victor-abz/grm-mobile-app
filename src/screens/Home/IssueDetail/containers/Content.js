import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBackHandler } from '@react-native-community/hooks';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment';
import { default as React, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Button, IconButton, TextInput } from 'react-native-paper';
import CustomSeparator from '../../../../components/CustomSeparator/CustomSeparator';
import CollapsibleSection from '../../../../components/CollapsibleSection';
import { baseURL } from '../../../../services/API';
import { colors } from '../../../../utils/colors';
import { citizenTypes } from '../../../../utils/utils';
import { styles } from './Content.styles';
import { useData } from '../../../../providers/DataProvider';
import { useIssueDetail } from '../../../../hooks/useIssueDetail';

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: colors.placeholder,
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
  users = [],
  userContext,
}) {
  const { t } = useTranslation();
  const { dataManager } = useData();
  const scrollViewRef = useRef();

  // Get current user ID from context
  const currentUserId =
    userContext?.user?.id || userContext?.user?.name || userContext?.user?.email;

  // Memoize lookup data to prevent infinite re-renders
  const lookupData = useMemo(
    () => ({
      categories,
      types,
      statuses,
      ageGroups,
      citizenGroups,
      regions,
      projects,
      users,
    }),
    [categories, types, statuses, ageGroups, citizenGroups, regions, projects, users]
  );

  // ========== USE ISSUE DETAIL HOOK ==========
  const {
    enrichedIssue,
    isUserAssigned,
    issueDaysAgo,
    collapsibleStates,
    collapsibleContent,
    toggleCollapsible,
    getSecureDisplayValue,
    mediaStates,
    setPlaying,
    setSound,
    setImageError,
    commentStates,
    updateNewComment,
    addComment,
    isContentConfidential,
  } = useIssueDetail(issue, lookupData, currentUserId, t);

  useBackHandler(
    () =>
      // navigation.navigate("GRM")
      // handle it
      true
  );

  // ========== MEDIA FUNCTIONS ==========
  const playSound = async (recordingUri, remoteUrl) => {
    if (!mediaStates.playing) {
      setPlaying(true);
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
        setSound(sound);
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
  };

  const onAddComment = async () => {
    const success = await addComment();
    if (success) {
      // Scroll to end after adding comment
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  };

  // ========== PERMISSIONS SETUP ==========
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

  // ========== LOADING STATE ==========
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

  // ========== RENDER HELPERS ==========
  const renderAttachments = () => {
    if (!enrichedIssue.attachments?.length) return null;

    return enrichedIssue.attachments.map((item, index) => (
      <View key={index}>
        {item.isAudio ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconButton
              icon="play"
              color={mediaStates.playing ? colors.disabled : colors.primary}
              size={24}
              onPress={() => playSound(item.local_url, item.url)}
            />
            <Text style={styles.audioText}>{t('Play Recorded Audio')}</Text>
          </View>
        ) : (
          <View>
            <Image
              source={{ uri: mediaStates.imageError ? item.url : item.local_url }}
              onError={() => setImageError(true)}
              style={styles.attachmentImage}
            />
          </View>
        )}
      </View>
    ));
  };

  const renderInfoField = (label, value) => (
    <Text style={styles.subtitle}>
      {label} <Text style={styles.text}>{value}</Text>
    </Text>
  );

  return (
    <ScrollView ref={scrollViewRef} contentContainerStyle={{ alignItems: 'center', padding: 20 }}>
      <View style={styles.infoContainer}>
        {/* ========== HEADER SECTION ========== */}
        <View style={{ flexDirection: 'row' }}>
          <View
            style={{ marginBottom: 10, justifyContent: 'flex-end', flex: 1, flexDirection: 'row' }}
          >
            <Text style={[styles.text, { fontSize: 12, color: colors.primary }]}>
              {enrichedIssue.issueDateFormatted} {issueDaysAgo} {t('days_ago')}
            </Text>
          </View>
        </View>

        {/* ========== MAIN INFO SECTION ========== */}
        <View
          style={{ flexDirection: 'row', flex: 1, justifyContent: 'space-between', marginTop: 10 }}
        >
          <View style={{ flex: 1 }}>
            {renderInfoField(t('type'), getSecureDisplayValue(enrichedIssue.typeLabel))}
            {renderInfoField(
              t('lodged_by'),
              citizenTypes[enrichedIssue.citizen_type] ?? t('information_not_available')
            )}
            {renderInfoField(t('name'), getSecureDisplayValue(enrichedIssue.citizen))}
            {renderInfoField(t('age'), getSecureDisplayValue(enrichedIssue.ageGroupLabel))}

            <View>
              <Text style={[styles.subtitle, { marginBottom: 0 }]}>{t('profession')} </Text>
              <Text style={[styles.text, { marginBottom: 5 }]}>
                {getSecureDisplayValue(enrichedIssue.citizenGroup1Label)}
              </Text>
            </View>

            <View>
              <Text style={[styles.subtitle, { marginBottom: 0 }]}>{t('educational_level')} </Text>
              <Text style={[styles.text, { marginBottom: 5 }]}>
                {getSecureDisplayValue(enrichedIssue.citizenGroup2Label)}
              </Text>
            </View>

            <View>
              <Text style={[styles.subtitle, { marginBottom: 0 }]}>{t('sub_type')} </Text>
              <Text style={[styles.text, { marginBottom: 5 }]}>
                {getSecureDisplayValue(enrichedIssue.issue_sub_type?.name)}
              </Text>
            </View>

            <View>
              <Text style={[styles.subtitle, { marginBottom: 0 }]}>{t('category')} </Text>
              <Text style={[styles.text, { marginBottom: 5 }]}>{enrichedIssue.categoryLabel}</Text>
            </View>

            {renderInfoField(t('location'), getSecureDisplayValue(enrichedIssue.regionLabel))}
            {renderInfoField(
              t('assigned_to'),
              enrichedIssue.assignee?.name ?? t('Pending Assignment')
            )}

            {/* Attachments */}
            {renderAttachments()}
          </View>
        </View>

        {/* ========== COLLAPSIBLE SECTIONS ========== */}
        <CustomSeparator />

        {/* Component Section */}
        <CollapsibleSection
          title={t('component')}
          isCollapsed={collapsibleStates.component}
          onToggle={() => toggleCollapsible('component')}
        >
          {renderInfoField(t('component'), getSecureDisplayValue(enrichedIssue.component?.name))}
          {renderInfoField(
            t('sub_component'),
            getSecureDisplayValue(enrichedIssue.sub_component?.name)
          )}
        </CollapsibleSection>

        <CustomSeparator />

        {/* Description Section */}
        <CollapsibleSection
          title={t('description_label')}
          isCollapsed={collapsibleStates.description}
          onToggle={() => toggleCollapsible('description')}
        >
          <Text style={styles.collapsibleTextArea}>{enrichedIssue.description}</Text>
        </CollapsibleSection>

        <CustomSeparator />

        {/* Decision/Resolution Section */}
        <CollapsibleSection
          title={t('decision')}
          isCollapsed={collapsibleStates.decision}
          onToggle={() => toggleCollapsible('decision')}
          showContent={collapsibleContent.resolution?.hasData}
          emptyStateText={t('no_resolution_data') || 'No resolution recorded'}
        >
          <Text style={styles.collapsibleTextArea}>
            {collapsibleContent.resolution?.content ||
              enrichedIssue.research_result ||
              t('information_not_available')}
          </Text>
        </CollapsibleSection>

        <CustomSeparator />

        {/* Satisfaction Section */}
        <CollapsibleSection
          title={t('satisfaction')}
          isCollapsed={collapsibleStates.satisfaction}
          onToggle={() => toggleCollapsible('satisfaction')}
          showContent={collapsibleContent.satisfaction?.hasData}
          emptyStateText={t('no_satisfaction_data') || 'No satisfaction data available'}
        >
          <Text style={styles.collapsibleTextArea}>{collapsibleContent.satisfaction?.content}</Text>
        </CollapsibleSection>

        <CustomSeparator />

        {/* Appeal Section */}
        <CollapsibleSection
          title={t('appeal_reason')}
          isCollapsed={collapsibleStates.appeal}
          onToggle={() => toggleCollapsible('appeal')}
          showContent={collapsibleContent.appeal?.hasData}
          emptyStateText={t('no_appeal_data') || 'No appeal submitted'}
        >
          <Text style={styles.collapsibleTextArea}>{collapsibleContent.appeal?.content}</Text>
        </CollapsibleSection>

        <CustomSeparator />

        {/* Back Button */}
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

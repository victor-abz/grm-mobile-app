import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBackHandler } from '@react-native-community/hooks';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment';
import React, { useEffect, useRef, useMemo, useState } from 'react';
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
import watermelonManager from '../../../../database/watermelonManager';
import { getFileType, getDisplayFileName } from '../../../../utils/fileUtils';

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

  const [attachments, setAttachments] = useState([]);
  const [attachmentsCollapsed, setAttachmentsCollapsed] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [audioPosition, setAudioPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentSound, setCurrentSound] = useState(null);

  // ========== FETCH ATTACHMENTS ==========
  useEffect(() => {
    async function fetchAttachments() {
      if (!enrichedIssue?.id) return;
      try {
        const atts = await watermelonManager.getAttachmentsForIssue(enrichedIssue.id);
        console.log('🔍 [IssueHistory] Attachments:', atts.length, atts);
        setAttachments(atts || []);
      } catch (e) {
        setAttachments([]);
      }
    }
    fetchAttachments();
  }, [enrichedIssue?.id]);

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

  // Fullscreen image modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImageUri, setModalImageUri] = useState(null);

  // ========== AUDIO HANDLERS ==========
  const formatTime = (timeMs) => {
    if (!timeMs || isNaN(timeMs)) return '0:00';
    const totalSeconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleAudioPlayback = async (item) => {
    try {
      // If this item is currently playing, stop it
      if (currentlyPlaying?.id === item.id) {
        if (currentSound) {
          await currentSound.stopAsync();
          await currentSound.unloadAsync();
        }
        setCurrentlyPlaying(null);
        setCurrentSound(null);
        setAudioPosition(0);
        setAudioDuration(0);
        return;
      }

      // Stop any currently playing audio
      if (currentSound) {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
      }

      // Load and play new audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: item.local_url || item.attachment },
        { shouldPlay: true, progressUpdateIntervalMillis: 100 }
      );

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setAudioPosition(status.positionMillis || 0);
          setAudioDuration(status.durationMillis || 0);

          if (status.didJustFinish) {
            setCurrentlyPlaying(null);
            setCurrentSound(null);
            setAudioPosition(0);
            setAudioDuration(0);
          }
        }
      });

      setCurrentSound(sound);
      setCurrentlyPlaying(item);
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentSound) {
        currentSound.unloadAsync();
      }
    };
  }, [currentSound]);

  const handleViewImage = (attachment) => {
    setModalImageUri(attachment.local_url || attachment.attachment);
    setModalVisible(true);
  };

  // ========== RENDER HELPERS ==========
  const renderAttachmentItem = (item, index) => {
    const fileType = getFileType(item.file_name);
    const displayName = getDisplayFileName(item.file_name, 25);
    const isCurrentlyPlaying = currentlyPlaying?.id === item.id;

    return (
      <View
        key={index}
        style={[styles.attachmentItem, isCurrentlyPlaying && styles.attachmentItemPlaying]}
      >
        <TouchableOpacity
          style={styles.attachmentItemHeader}
          onPress={() => {
            if (fileType === 'audio') {
              handleAudioPlayback(item);
            } else if (fileType === 'image') {
              handleViewImage(item);
            }
          }}
        >
          <MaterialCommunityIcons
            name={
              fileType === 'audio'
                ? isCurrentlyPlaying
                  ? 'stop'
                  : 'play'
                : fileType === 'image'
                ? 'eye'
                : 'file-document'
            }
            size={20}
            color={
              fileType === 'audio'
                ? isCurrentlyPlaying
                  ? '#dc3545'
                  : colors.primary
                : fileType === 'image'
                ? '#28a745'
                : '#6c757d'
            }
            style={styles.fileIcon}
          />

          <Text
            style={[styles.fileName, isCurrentlyPlaying && styles.fileNamePlaying]}
            numberOfLines={1}
          >
            {displayName}
          </Text>

          {fileType === 'audio' && isCurrentlyPlaying ? (
            <View style={styles.audioControls}>
              {/* Sound wave animation */}
              <View style={styles.soundWaveContainer}>
                <View style={[styles.soundWave, styles.soundWave1]} />
                <View style={[styles.soundWave, styles.soundWave2]} />
                <View style={[styles.soundWave, styles.soundWave3]} />
                <View style={[styles.soundWave, styles.soundWave4]} />
              </View>

              {/* Timer */}
              <Text style={styles.audioTimer}>
                {formatTime(audioPosition)} / {formatTime(audioDuration)}
              </Text>
            </View>
          ) : (
            <View style={styles.fileTypeIndicator}>
              <Text style={styles.fileTypeText}>
                {fileType === 'audio' ? t('Audio') : fileType === 'image' ? t('Image') : t('Doc')}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderAttachments = () => {
    if (!attachments?.length) {
      return null;
    }

    // Separate attachments by type
    const audioAttachments = attachments.filter((item) => getFileType(item.file_name) === 'audio');
    const imageAttachments = attachments.filter((item) => getFileType(item.file_name) === 'image');
    const otherAttachments = attachments.filter((item) => {
      const type = getFileType(item.file_name);
      return type !== 'audio' && type !== 'image';
    });

    return (
      <CollapsibleSection
        title={`${t('attachments')} (${attachments.length})`}
        isCollapsed={attachmentsCollapsed}
        onToggle={() => setAttachmentsCollapsed(!attachmentsCollapsed)}
        showContent={true}
      >
        <View style={styles.attachmentsList}>
          {/* Audio Section */}
          {audioAttachments.length > 0 && (
            <View>
              <View style={styles.attachmentTypeHeader}>
                <MaterialCommunityIcons name="music-note" size={16} color={colors.primary} />
                <Text style={styles.attachmentTypeTitle}>
                  {t('Audios')} ({audioAttachments.length})
                </Text>
              </View>
              {audioAttachments.map((item) => {
                const originalIndex = attachments.indexOf(item);
                return renderAttachmentItem(item, originalIndex);
              })}
            </View>
          )}

          {/* Image Section */}
          {imageAttachments.length > 0 && (
            <View>
              <View style={styles.attachmentTypeHeader}>
                <MaterialCommunityIcons name="image" size={16} color="#28a745" />
                <Text style={styles.attachmentTypeTitle}>
                  {t('Images')} ({imageAttachments.length})
                </Text>
              </View>
              {imageAttachments.map((item) => {
                const originalIndex = attachments.indexOf(item);
                return renderAttachmentItem(item, originalIndex);
              })}
            </View>
          )}

          {/* Documents Section */}
          {otherAttachments.length > 0 && (
            <View>
              <View style={styles.attachmentTypeHeader}>
                <MaterialCommunityIcons name="file-document" size={16} color="#6c757d" />
                <Text style={styles.attachmentTypeTitle}>
                  {t('Documents')} ({otherAttachments.length})
                </Text>
              </View>
              {otherAttachments.map((item) => {
                const originalIndex = attachments.indexOf(item);
                return renderAttachmentItem(item, originalIndex);
              })}
            </View>
          )}
        </View>
      </CollapsibleSection>
    );
  };

  const renderInfoField = (label, value) => (
    <Text style={styles.subtitle}>
      {label} <Text style={styles.text}>{value}</Text>
    </Text>
  );

  return (
    <>
      <ScrollView ref={scrollViewRef} contentContainerStyle={{ alignItems: 'center', padding: 20 }}>
        <View style={styles.infoContainer}>
          {/* ========== HEADER SECTION ========== */}
          <View style={{ flexDirection: 'row' }}>
            <View
              style={{
                marginBottom: 10,
                justifyContent: 'flex-end',
                flex: 1,
                flexDirection: 'row',
              }}
            >
              <Text style={[styles.text, { fontSize: 12, color: colors.primary }]}>
                {enrichedIssue.issueDateFormatted} {issueDaysAgo} {t('days_ago')}
              </Text>
            </View>
          </View>

          {/* ========== MAIN INFO SECTION ========== */}
          <View
            style={{
              flexDirection: 'row',
              flex: 1,
              justifyContent: 'space-between',
              marginTop: 10,
            }}
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
                <Text style={[styles.subtitle, { marginBottom: 0 }]}>
                  {t('educational_level')}{' '}
                </Text>
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
                <Text style={[styles.text, { marginBottom: 5 }]}>
                  {enrichedIssue.categoryLabel}
                </Text>
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
            <Text style={styles.collapsibleTextArea}>
              {collapsibleContent.satisfaction?.content}
            </Text>
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
    </>
  );
}

export default Content;

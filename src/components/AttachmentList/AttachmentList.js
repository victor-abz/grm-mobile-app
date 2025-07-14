import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useTranslation } from 'react-i18next';
import { getFileType, getDisplayFileName } from '../../utils/fileUtils';
import { colors } from '../../utils/colors';
import { styles } from './AttachmentList.styles';

const AttachmentList = ({
  attachments = [],
  showTypeHeaders = true,
  onImagePress,
  onRemoveAttachment,
  showRemoveButton = false,
  style,
}) => {
  const { t } = useTranslation();
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [audioPosition, setAudioPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentSound, setCurrentSound] = useState(null);

  // Format time in MM:SS format
  const formatTime = (timeMs) => {
    if (!timeMs || Number.isNaN(timeMs)) return '0:00';
    const totalSeconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle audio playback
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
  useEffect(
    () => () => {
      if (currentSound) {
        currentSound.unloadAsync();
      }
    },
    [currentSound]
  );

  // Helper functions for icon rendering
  const getIconName = (fileType, isCurrentlyPlaying) => {
    if (fileType === 'audio') {
      return isCurrentlyPlaying ? 'stop' : 'play';
    }
    if (fileType === 'image') {
      return 'eye';
    }
    return 'file-document';
  };

  const getIconColor = (fileType, isCurrentlyPlaying) => {
    if (fileType === 'audio') {
      return isCurrentlyPlaying ? '#dc3545' : colors.primary;
    }
    if (fileType === 'image') {
      return '#28a745';
    }
    return '#6c757d';
  };

  const getFileTypeText = (fileType) => {
    if (fileType === 'audio') return t('Audio');
    if (fileType === 'image') return t('Image');
    return t('Doc');
  };

  // Render individual attachment item
  const renderAttachmentItem = (item, index) => {
    const fileType = getFileType(item.file_name || item.fileName);
    const displayName = getDisplayFileName(item.file_name || item.fileName, 25);
    const isCurrentlyPlaying = currentlyPlaying?.id === item.id;

    return (
      <View
        key={item.id || index}
        style={[styles.attachmentItem, isCurrentlyPlaying && styles.attachmentItemPlaying]}
      >
        <TouchableOpacity
          style={styles.attachmentItemHeader}
          onPress={() => {
            if (fileType === 'audio') {
              handleAudioPlayback(item);
            } else if (fileType === 'image' && onImagePress) {
              onImagePress(item);
            }
          }}
        >
          <MaterialCommunityIcons
            name={getIconName(fileType, isCurrentlyPlaying)}
            size={20}
            color={getIconColor(fileType, isCurrentlyPlaying)}
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
              <Text style={styles.fileTypeText}>{getFileTypeText(fileType)}</Text>
            </View>
          )}

          {showRemoveButton && onRemoveAttachment && (
            <TouchableOpacity style={styles.removeButton} onPress={() => onRemoveAttachment(index)}>
              <MaterialCommunityIcons name="close" size={16} color="#dc3545" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (!attachments?.length) {
    return null;
  }

  // Separate attachments by type if headers are needed
  if (showTypeHeaders) {
    const audioAttachments = attachments.filter(
      (item) => getFileType(item.file_name || item.fileName) === 'audio'
    );
    const imageAttachments = attachments.filter(
      (item) => getFileType(item.file_name || item.fileName) === 'image'
    );
    const otherAttachments = attachments.filter((item) => {
      const type = getFileType(item.file_name || item.fileName);
      return type !== 'audio' && type !== 'image';
    });

    return (
      <View style={[styles.attachmentsList, style]}>
        {/* Audio Section */}
        {audioAttachments.length > 0 && (
          <View>
            <View style={styles.attachmentTypeHeader}>
              <MaterialCommunityIcons name="music-note" size={16} color={colors.primary} />
              <Text style={styles.attachmentTypeTitle}>
                {t('Audio')} ({audioAttachments.length})
              </Text>
            </View>
            {audioAttachments.map((item, _index) =>
              renderAttachmentItem(item, attachments.indexOf(item))
            )}
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
            {imageAttachments.map((item, _index) =>
              renderAttachmentItem(item, attachments.indexOf(item))
            )}
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
            {otherAttachments.map((item, _index) =>
              renderAttachmentItem(item, attachments.indexOf(item))
            )}
          </View>
        )}
      </View>
    );
  }

  // Simple list without type headers
  return (
    <View style={[styles.attachmentsList, style]}>
      {attachments.map((item, index) => renderAttachmentItem(item, index))}
    </View>
  );
};

export { AttachmentList };
export default AttachmentList;

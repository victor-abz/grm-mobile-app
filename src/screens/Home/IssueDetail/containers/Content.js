import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBackHandler } from '@react-native-community/hooks';
import * as ImagePicker from 'expo-image-picker';
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
  StyleSheet,
  Alert,
} from 'react-native';
import { Button } from 'react-native-paper';
import CustomSeparator from '../../../../components/CustomSeparator/CustomSeparator';
import CollapsibleSection from '../../../../components/CollapsibleSection';
import { colors } from '../../../../utils/colors';
import { citizenTypes } from '../../../../utils/utils';
import { useIssueDetail } from '../../../../hooks/useIssueDetail';
import watermelonManager from '../../../../database/watermelonManager';
import { AttachmentList } from '../../../../components/AttachmentList/AttachmentList';

const styles = StyleSheet.create({
  infoContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#333',
  },
  subtitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#707070',
    marginBottom: 5,
  },
  collapsibleTextArea: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: colors.placeholder,
    text: '#707070',
  },
};

const Content = ({
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
}) => {
  const { t } = useTranslation();
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
    issueDaysAgo,
    collapsibleStates,
    collapsibleContent,
    toggleCollapsible,
    getSecureDisplayValue,
  } = useIssueDetail(issue, lookupData, currentUserId, t);

  useBackHandler(
    () =>
      // navigation.navigate("GRM")
      // handle it
      true
  );

  const [attachments, setAttachments] = useState([]);
  const [attachmentsCollapsed, setAttachmentsCollapsed] = useState(true);

  // ========== FETCH ATTACHMENTS ==========
  useEffect(() => {
    async function fetchAttachments() {
      if (!enrichedIssue?.id) return;
      try {
        const atts = await watermelonManager.getAttachmentsForIssue(enrichedIssue.id);
        console.log('📎 Loaded attachments:', atts.length);
        setAttachments(atts || []);
      } catch (e) {
        setAttachments([]);
      }
    }
    fetchAttachments();
  }, [enrichedIssue?.id]);

  // ========== PERMISSIONS SETUP ==========
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('Sorry, we need camera roll permissions to make this work!'));
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

  const handleViewImage = (attachment) => {
    setModalImageUri(attachment.local_url || attachment.attachment);
    setModalVisible(true);
  };

  const renderAttachments = () => {
    if (!attachments?.length) {
      return null;
    }

    return (
      <CollapsibleSection
        title={`${t('attachments')} (${attachments.length})`}
        isCollapsed={attachmentsCollapsed}
        onToggle={() => setAttachmentsCollapsed(!attachmentsCollapsed)}
        showContent
      >
        <AttachmentList attachments={attachments} showTypeHeaders onImagePress={handleViewImage} />
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
};

export default Content;

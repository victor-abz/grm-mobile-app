/* eslint-disable no-use-before-define */
import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Modal,
  StyleSheet as RNStyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Divider } from 'react-native-paper';
import dayjs from '../../../../utils/dayjs';
import { colors } from '../../../../utils/colors';
import { logger } from '../../../../utils/logger';
import { styles } from './Content.styles';
import {
  createUserLookupMap,
  processComments,
  shouldShowDetailedContent,
} from '../../../../utils/issueHistoryUtils';

const _theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: colors.placeholder,
    text: '#707070',
  },
};

const Content = ({ issue, comments: commentsFromDB, users }) => {
  const { t } = useTranslation();

  // Log screen load
  useEffect(() => {
    logger.userAction('screen_load', 'IssueHistory', {
      issueId: issue?.id || issue?._raw?.id,
      isArray: Array.isArray(issue),
      hasRawData: !!issue?._raw,
      commentsCount: commentsFromDB?.length || 0,
      usersCount: users?.length || 0,
    });
  }, []);

  // Log issue data processing
  logger.info('IssueHistory: Processing issue data', {
    isArray: Array.isArray(issue),
    issue: issue?._raw ? 'WatermelonDB Object' : 'Raw Object',
    commentsFromDB: commentsFromDB?.length || 0,
    usersCount: users?.length || 0,
  });

  if (issue && issue._raw) {
    logger.info('IssueHistory: Raw issue data', {
      id: issue._raw.id,
      commentsFromDB: commentsFromDB?.length || 0,
      usersCount: users?.length || 0,
    });
  }

  // ========== MEMOIZED VALUES ==========
  // Create user lookup map using utility
  const userMap = useMemo(() => {
    const map = createUserLookupMap(users);
    logger.info('IssueHistory: User map created', {
      userMapSize: map.size,
      usersCount: users?.length || 0,
    });
    return map;
  }, [users]);

  // Enrich issue data
  const enrichedIssue = useMemo(() => {
    if (!issue) return null;

    const issueData = Array.isArray(issue) ? issue[0] : issue;
    if (!issueData) return null;

    const rawData = issueData._raw || issueData;

    const enriched = {
      ...rawData,
      id: rawData.id,
      name: rawData.name || rawData.id,
      administrative_region: rawData.administrative_region,
      regionName: rawData.regionName || rawData.region_name,
    };

    logger.info('IssueHistory: Enriched issue', {
      id: enriched.id,
      commentsFromDB: commentsFromDB?.length || 0,
      usersInMap: userMap.size,
      administrative_region: enriched.administrative_region,
      regionName: enriched.regionName,
    });

    return enriched;
  }, [issue, commentsFromDB, userMap]);

  // ========== STATE MANAGEMENT ==========
  const [comments, setComments] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selected, setSelected] = useState(null);

  // ========== COMMENT PROCESSING ==========
  const loadComments = () => {
    const processedComments = processComments(commentsFromDB, userMap, t);
    setComments(processedComments);
  };

  // ========== DIALOG MANAGEMENT ==========
  const _hideDialog = () => setShowDialog(false);
  const _showDialog = (_selected) => {
    logger.userAction('view_comment_detail', 'IssueHistory', {
      issueId: enrichedIssue?.id,
      activityType: _selected?.activity_type,
      commentId: _selected?.id,
    });
    setShowDialog(true);
    setSelected(_selected);
  };

  // ========== RENDERING ==========
  const renderItem = ({ item, index }) => {
    const commentText = item.comment_text;
    const commentAuthor = item.comment_by;
    const commentDate = item.comment_date;
    const activityType = item.activity_type;
    const isDetailedContent = shouldShowDetailedContent(activityType, t);

    return (
      <View key={index} style={styles.commentCard}>
        <TouchableOpacity onPress={() => _showDialog(item)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
            <View style={styles.greenCircle} />
            <View style={{ flex: 1 }}>
              <Text style={styles.radioLabel}>{activityType}</Text>
              <Text style={[styles.radioLabel, { fontSize: 12, color: 'gray' }]}>
                by {commentAuthor}
              </Text>
            </View>
          </View>

          {/* Show different content based on activity type */}
          <Text
            style={[styles.stepNote, isDetailedContent ? {} : { fontStyle: 'italic' }]}
            numberOfLines={isDetailedContent ? 3 : 2}
          >
            {commentText}
          </Text>

          <Text style={styles.dateLabel}>{dayjs(commentDate).format('LLL')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const listHeader = () => <Text style={styles.title}>{t('activity_label')}</Text>;
  const dividerItem = () => <Divider />;

  // ========== EFFECTS ==========
  useEffect(() => {
    logger.info('IssueHistory: useEffect triggered', {
      enrichedIssue: !!enrichedIssue,
      commentsFromDB: commentsFromDB?.length || 0,
      userMapSize: userMap.size,
    });

    if (enrichedIssue) {
      loadComments();
    }
  }, [enrichedIssue, commentsFromDB, userMap]);

  // ========== CONDITIONAL RENDERING ==========
  if (!enrichedIssue) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('loading_issue_data')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {comments?.length > 0 ? (
        <FlatList
          ItemSeparatorComponent={dividerItem}
          ListHeaderComponent={listHeader}
          data={comments}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id || `comment_${index}`}
        />
      ) : (
        <View style={styles.container}>
          <Text style={styles.title}>{t('activity_label')}</Text>
          <Text style={styles.stepNote}>{t('no_activity_yet')}</Text>
        </View>
      )}

      {/* ========== ACTIVITY DETAIL DIALOG ========== */}
      <Modal
        visible={showDialog}
        transparent
        animationType="fade"
        onRequestClose={_hideDialog}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={_hideDialog}>
          <View style={historyDialogStyles.backdrop}>
            <TouchableWithoutFeedback>
              <View style={historyDialogStyles.card}>
                <View style={historyDialogStyles.header}>
                  <Text style={historyDialogStyles.title}>
                    {selected?.activity_type || 'Activity'}
                  </Text>
                </View>
                <View style={historyDialogStyles.body}>
                  <Text style={historyDialogStyles.metaText}>
                    {t('performed_by') || 'Performed by'}: {selected?.comment_by || 'System'}
                  </Text>
                  <Text style={historyDialogStyles.dateText}>
                    {selected && dayjs(selected.comment_date).format('LLL')}
                  </Text>
                  {shouldShowDetailedContent(selected?.activity_type, t) ? (
                    <View>
                      <Text style={historyDialogStyles.sectionLabel}>
                        {selected?.activity_type === (t('record_steps_taken') || 'Steps Recorded')
                          ? t('steps_details') || 'Steps Details'
                          : t('resolution_details') || 'Resolution Details'}
                        :
                      </Text>
                      <View style={historyDialogStyles.detailBox}>
                        <Text style={historyDialogStyles.detailText}>
                          {selected?.full_text || 'No details provided'}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={historyDialogStyles.contentText}>
                      {selected?.full_text || 'No comment text'}
                    </Text>
                  )}
                </View>
                <View style={historyDialogStyles.footer}>
                  <TouchableOpacity
                    style={[historyDialogStyles.button, historyDialogStyles.secondaryButton]}
                    onPress={_hideDialog}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        historyDialogStyles.buttonText,
                        historyDialogStyles.secondaryButtonText,
                      ]}
                    >
                      {t('close')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const historyDialogStyles = RNStyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 4 },
  title: { fontSize: 20, fontFamily: 'Poppins_600SemiBold', color: '#1a1a1a' },
  body: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8 },
  metaText: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: '#333', marginBottom: 4 },
  dateText: { fontSize: 12, color: '#999', marginBottom: 12, fontFamily: 'Poppins_400Regular' },
  sectionLabel: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: '#333', marginBottom: 8 },
  detailBox: {
    backgroundColor: '#f8f9fa',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  detailText: { fontSize: 14, lineHeight: 20, color: '#555', fontFamily: 'Poppins_400Regular' },
  contentText: { fontSize: 15, lineHeight: 22, color: '#555', fontFamily: 'Poppins_400Regular' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  secondaryButton: { backgroundColor: '#f0f0f0' },
  buttonText: { fontSize: 15, fontFamily: 'Poppins_500Medium' },
  secondaryButtonText: { color: '#666' },
});

export default Content;

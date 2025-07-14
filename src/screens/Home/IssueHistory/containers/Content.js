import moment from 'moment';
import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Button, Dialog, Divider, Paragraph, Portal } from 'react-native-paper';
import { colors } from '../../../../utils/colors';
import { styles } from './Content.styles';
import {
  createUserLookupMap,
  processComments,
  shouldShowDetailedContent,
} from '../../../../utils/issueHistoryUtils';

const theme = {
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

  // Debug logging for IssueHistory
  console.log('🔍 [IssueHistory] Processing issue data:', {
    isArray: Array.isArray(issue),
    issue: issue?._raw ? 'WatermelonDB Object' : 'Raw Object',
    commentsFromDB: commentsFromDB?.length || 0,
    usersCount: users?.length || 0,
  });

  if (issue && issue._raw) {
    console.log('🔍 [IssueHistory] Raw issue data:', {
      id: issue._raw.id,
      commentsFromDB: commentsFromDB?.length || 0,
      usersCount: users?.length || 0,
    });
  }

  // ========== MEMOIZED VALUES ==========
  // Create user lookup map using utility
  const userMap = useMemo(() => {
    const map = createUserLookupMap(users);
    console.log('🔍 [IssueHistory] User map created:', map.size, 'users');
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

    console.log('✅ [IssueHistory] Enriched issue:', {
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

          <Text style={styles.dateLabel}>{moment(commentDate).format('LLL')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const listHeader = () => <Text style={styles.title}>{t('activity_label')}</Text>;
  const dividerItem = () => <Divider />;

  // ========== EFFECTS ==========
  useEffect(() => {
    console.log('🔍 [IssueHistory] useEffect triggered:', {
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
      <Portal>
        <Dialog visible={showDialog} onDismiss={_hideDialog}>
          <Dialog.Title>{selected?.activity_type || 'Activity'}</Dialog.Title>
          <Dialog.Content>
            <Text style={{ fontWeight: 'bold', marginBottom: 5, fontSize: 14 }}>
              {t('performed_by') || 'Performed by'}: {selected?.comment_by || 'System'}
            </Text>
            <Text style={{ fontWeight: 'bold', marginBottom: 10, fontSize: 12, color: 'gray' }}>
              {selected && moment(selected.comment_date).format('LLL')}
            </Text>

            {/* Show activity details based on type */}
            {shouldShowDetailedContent(selected?.activity_type, t) ? (
              <View>
                <Text style={{ fontWeight: 'bold', marginBottom: 5, fontSize: 14 }}>
                  {selected?.activity_type === (t('record_steps_taken') || 'Steps Recorded')
                    ? t('steps_details') || 'Steps Details'
                    : t('resolution_details') || 'Resolution Details'}
                  :
                </Text>
                <Paragraph style={{ backgroundColor: '#f5f5f5', padding: 10, borderRadius: 5 }}>
                  {selected?.full_text || 'No details provided'}
                </Paragraph>
              </View>
            ) : (
              <Paragraph>{selected?.full_text || 'No comment text'}</Paragraph>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              theme={theme}
              style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              onPress={_hideDialog}
            >
              {t('close')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

export default Content;

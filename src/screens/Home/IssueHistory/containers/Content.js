import moment from 'moment';
import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Button, Dialog, Divider, Paragraph, Portal } from 'react-native-paper';
import { colors } from '../../../../utils/colors';
import { styles } from './Content.styles';

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: '#dedede',
    text: '#707070',
  },
};

function Content({ issue, comments: commentsFromDB, users }) {
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

  // Create user lookup map
  const userMap = useMemo(() => {
    const map = new Map();
    if (users && Array.isArray(users)) {
      users.forEach((user) => {
        const userData = user._raw || user;
        if (userData && userData.id) {
          map.set(userData.id, userData.full_name || userData.email || userData.id);
        }
      });
    }

    // Add Administrator mapping as fallback
    map.set('Administrator', 'Administrator');
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
    };

    console.log('✅ [IssueHistory] Enriched issue:', {
      id: enriched.id,
      commentsFromDB: commentsFromDB?.length || 0,
      usersInMap: userMap.size,
    });

    return enriched;
  }, [issue, commentsFromDB, userMap]);

  const [comments, setComments] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selected, setSelected] = useState(null);

  const loadComments = () => {
    if (!commentsFromDB || commentsFromDB.length === 0) {
      console.log('🔍 [IssueHistory] No comments found from database');
      setComments([]);
      return;
    }

    console.log('🔍 [IssueHistory] Loading comments from database:', commentsFromDB.length);

    // Process comments from WatermelonDB
    const processedComments = commentsFromDB.map((commentRecord) => {
      const rawComment = commentRecord._raw || commentRecord;

      // Get user name from user map
      const userName = userMap.get(rawComment.user_id) || rawComment.user_id || 'System';

      // Determine activity type and display format
      let activityType = 'General Activity';
      let displayText = rawComment.comment;
      let fullText = rawComment.comment;

      // Use activity_type from comment record if available (new format)
      switch (rawComment.activity_type) {
        case 'accept':
          activityType = t('accept_issue') || 'Issue Accepted';
          displayText = `${activityType} by ${userName}`;
          fullText =
            t('issue_accepted_explanation') ||
            'Issue has been accepted and assigned for processing';
          break;

        default:
          activityType = rawComment.activity_type;
          displayText = rawComment.comment;
          fullText = rawComment.comment;
          break;
      }

      console.log('🔍 [IssueHistory] Processing comment:', {
        id: rawComment.id,
        activityType: activityType,
        displayText: displayText?.substring(0, 50) + '...',
        user_id: rawComment.user_id,
        userName: userName,
        created_at: rawComment.created_at,
      });

      return {
        id: rawComment.id,
        comment_text: displayText,
        full_text: fullText,
        activity_type: activityType,
        comment_by: userName,
        comment_date: rawComment.created_at,
        user_id: rawComment.user_id,
      };
    });

    console.log('✅ [IssueHistory] Processed comments:', processedComments.length);
    setComments(processedComments);
  };

  const _hideDialog = () => setShowDialog(false);
  const _showDialog = (_selected) => {
    setShowDialog(true);
    setSelected(_selected);
  };

  const renderItem = ({ item, index }) => {
    const commentText = item.comment_text;
    const commentAuthor = item.comment_by;
    const commentDate = item.comment_date;
    const activityType = item.activity_type;

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
          {activityType === (t('record_steps_taken') || 'Steps Recorded') ||
          activityType === (t('record_resolution') || 'Issue Resolved') ? (
            <Text style={styles.stepNote} numberOfLines={3}>
              {commentText}
            </Text>
          ) : (
            <Text style={[styles.stepNote, { fontStyle: 'italic' }]} numberOfLines={2}>
              {commentText}
            </Text>
          )}

          <Text style={styles.dateLabel}>{moment(commentDate).format('LLL')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const listHeader = () => <Text style={styles.title}>{t('activity_label')}</Text>;

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

  const dividerItem = () => <Divider />;

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

            {/* Show activity details */}
            {selected?.activity_type === (t('record_steps_taken') || 'Steps Recorded') ? (
              <View>
                <Text style={{ fontWeight: 'bold', marginBottom: 5, fontSize: 14 }}>
                  {t('steps_details') || 'Steps Details'}:
                </Text>
                <Paragraph style={{ backgroundColor: '#f5f5f5', padding: 10, borderRadius: 5 }}>
                  {selected?.full_text || 'No details provided'}
                </Paragraph>
              </View>
            ) : selected?.activity_type === (t('record_resolution') || 'Issue Resolved') ? (
              <View>
                <Text style={{ fontWeight: 'bold', marginBottom: 5, fontSize: 14 }}>
                  {t('resolution_details') || 'Resolution Details'}:
                </Text>
                <Paragraph style={{ backgroundColor: '#f5f5f5', padding: 10, borderRadius: 5 }}>
                  {selected?.full_text || 'No resolution details provided'}
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
}

export default Content;

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

function Content({ issue }) {
  const { t } = useTranslation();

  // Debug logging for IssueHistory
  console.log('🔍 [IssueHistory] Processing issue data:', {
    isArray: Array.isArray(issue),
    issue: issue?._raw ? 'WatermelonDB Object' : 'Raw Object',
  });

  if (issue && issue._raw) {
    console.log('🔍 [IssueHistory] Raw issue data:', {
      id: issue._raw.id,
      comments: issue._raw.comments?.length || 0,
      hasComments: !!issue._raw.comments,
    });
  }

  // Enrich issue data
  const enrichedIssue = useMemo(() => {
    if (!issue) return null;

    const issueData = Array.isArray(issue) ? issue[0] : issue;
    if (!issueData) return null;

    const rawData = issueData._raw || issueData;

    const enriched = {
      ...rawData,

      // Handle comments - ensure they're an array
      comments: rawData.comments || [],

      // Other enriched fields for consistency
      id: rawData.id,
      name: rawData.name || rawData.id,
    };

    console.log('✅ [IssueHistory] Enriched issue:', {
      id: enriched.id,
      commentsCount: enriched.comments?.length || 0,
      sampleComment: enriched.comments?.[0],
    });

    return enriched;
  }, [issue]);

  const [comments, setComments] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selected, setSelected] = useState(null);

  const loadComments = () => {
    if (!enrichedIssue?.comments) {
      console.log('🔍 [IssueHistory] No comments found');
      setComments([]);
      return;
    }

    console.log('🔍 [IssueHistory] Loading comments:', enrichedIssue.comments);

    // Create inverted comments array and sort by date (most recent first)
    const invertedComments = [...enrichedIssue.comments];
    const sortedComments = invertedComments.sort((a, b) => {
      const dateA = new Date(a.comment_date || a.due_at || a.created_at);
      const dateB = new Date(b.comment_date || b.due_at || b.created_at);
      return dateB.getTime() - dateA.getTime();
    });

    console.log('✅ [IssueHistory] Sorted comments:', sortedComments.length);
    setComments(sortedComments);
  };

  const _hideDialog = () => setShowDialog(false);
  const _showDialog = (_selected) => {
    setShowDialog(true);
    setSelected(_selected);
  };

  const renderItem = ({ item, index }) => {
    // Handle different comment formats
    const commentText = item.comment_text || item.comment || 'No comment text';
    const commentAuthor = item.comment_by || item.name || item.author || 'System';
    const commentDate = item.comment_date || item.due_at || item.created_at || new Date();

    return (
      <View key={index} style={styles.commentCard}>
        <TouchableOpacity onPress={() => _showDialog(item)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
            <View style={styles.greenCircle} />
            <View>
              <Text style={styles.radioLabel}>{commentAuthor}</Text>
            </View>
          </View>
          <Text style={styles.stepNote} numberOfLines={2}>
            {commentText}
          </Text>
          <Text style={styles.dateLabel}>{moment(commentDate).format('LLL')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const listHeader = () => <Text style={styles.title}>{t('activity_label')}</Text>;

  useEffect(() => {
    if (enrichedIssue) {
      loadComments();
    }
  }, [enrichedIssue]);

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
          keyExtractor={(item, index) =>
            item.id || item.comment_date || item.due_at || item.created_at || `comment_${index}`
          }
        />
      ) : (
        <View style={styles.container}>
          <Text style={styles.title}>{t('activity_label')}</Text>
          <Text style={styles.stepNote}>{t('no_activity_yet')}</Text>
        </View>
      )}

      <Portal>
        <Dialog visible={showDialog} onDismiss={_hideDialog}>
          <Dialog.Title>
            {selected?.comment_by || selected?.name || selected?.author || 'System'}
          </Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              {selected?.comment_text || selected?.comment || 'No comment text'}
            </Paragraph>
            <Text style={{ marginTop: 10, fontSize: 12, color: 'gray' }}>
              {selected &&
                moment(selected.comment_date || selected.due_at || selected.created_at).format(
                  'LLL'
                )}
            </Text>
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

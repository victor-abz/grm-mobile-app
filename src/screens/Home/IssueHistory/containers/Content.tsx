import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import moment from 'moment';
import { styles } from './Content.styles';
import { i18n } from '../../../../translations/i18n';
import { Button, Dialog, Paragraph, Portal, Divider, TextInput } from 'react-native-paper';
import { colors } from '../../../../utils/colors';
import ImagePreviewCard from '../../CitizenReportStep2/containers/ImagePreviewCard';
import { useIssueComments } from '../../../../hooks/issues/useIssueComments';
import { useDispatch, useSelector } from 'react-redux';
import { IssueComment } from '../../../../models/issues/IssueComment';
import RecordingCard from '../../GRM/components/RecordingCard';
import { Icon } from 'react-native-elements';
import { setNewCommentsFlag } from '../../../../store/ducks/global.duck';

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
  const {
    issueCommentsList,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    createIssueComment,
    refreshComments,
  } = useIssueComments(issue.id);
  const { profile, session } = useSelector((state: any) => state.get('authentication').toObject());
  const { newCommentsFlag } = useSelector((state) => state.get('global').toObject());
  const dispatch = useDispatch()
  
  const [commentText, setCommentText] = useState('');

  const commentInputRef = useRef(null);
  const commentsListRef = useRef(null);
  const loadMoreTriggeredRef = useRef(false);

  const [showDialog, setShowDialog] = useState(false);
  const [selected, setSelected] = useState(null);

  const _hideDialog = () => setShowDialog(false);
  const _showDialog = (_selected) => {
    setShowDialog(true);
    setSelected(_selected);
  };

  // Focus the list to the end of messages on load
  useEffect(() => {
    if (commentsListRef.current)
      setTimeout(() => commentsListRef.current?.scrollToIndex({ index: 0, animated: true }), 400);
  }, [commentsListRef.current]);

  const onPaginate = useCallback(
    (e) => {
      // const y = e?.nativeEvent?.contentOffset?.y ?? 0;
      // when user scrolls to (or near) top, load older items (next page)
      // if (y <= 40 && hasMore && !loadingMore && !loading && !loadMoreTriggeredRef.current) {
      if (hasMore && !loadingMore && !loading && !loadMoreTriggeredRef.current) {
        loadMoreTriggeredRef.current = true;
        loadMore();
      }
    },
    [hasMore, loadingMore, loading, loadMore]
  );

  const renderItem = ({ item, index }) => {
    return (
      <View key={index} style={styles.commentCard}>
        <TouchableOpacity onPress={() => _showDialog(item)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
            <View style={styles.greenCircle} />
            <View>
              <Text style={styles.radioLabel}>{item.user?.name ?? item.name}</Text>
            </View>
          </View>
          <Text style={styles.stepNote} numberOfLines={2}>
            {item.comment}
          </Text>
          <Text style={styles.dateLabel}>{moment(item.due_date).format('LLL')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const onPressSend = async () => {
    if (commentText.length === 0) return;
    const newComment: IssueComment = {
      id: undefined,
      parent_id: String(issue.id),
      user: { id: session.user_id, name: profile?.user?.name },
      comment: commentText,
      due_date: new Date().toISOString(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };
    await createIssueComment(newComment);
    setCommentText('');
    commentInputRef.current?.blur();
    setTimeout(() => commentsListRef.current?.scrollToIndex({ index: 0, animated: true }), 500);
  };

  const handleReloadComments = useCallback(async () => {
    refreshComments()
    dispatch(setNewCommentsFlag(false))
    setTimeout(() => {
      commentsListRef.current?.scrollToIndex({ index: 0, animated: true });
    }, 400);
  }, [issue.id]);

  //Modal, Messages List and Comment Input
  return (
    <View style={styles.container}>
      <Portal>
        <Dialog visible={showDialog} onDismiss={_hideDialog}>
          <Dialog.Title>{selected?.name}</Dialog.Title>
          <Dialog.Content>
            <Paragraph>{selected?.comment}</Paragraph>
            <View>
              {(selected?.attachment || selected?.recording) && (
                <View style={{ flexDirection: 'row', maxWidth: '100%', justifyContent: 'center' }}>
                  {selected?.attachment && selected?.attachment.local_url && (
                    <ImagePreviewCard
                      uri={selected.attachment.local_url}
                      id={selected.attachment.id}
                      onRemove={() => {}}
                      onRetry={() => {}}
                      showRemove={false}
                    />
                  )}
                  {selected?.recording && (
                    <RecordingCard
                      mode="playback"
                      initialURI={selected.recording.local_url}
                      onRecordingSaved={() => {}}
                    />
                  )}
                </View>
              )}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              theme={theme}
              style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              onPress={_hideDialog}
            >
              {i18n.t('close')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1, justifyContent: 'space-around' }}>
            {issueCommentsList?.length > 0 ? (
              <FlatList
                ref={commentsListRef}
                style={{ flex: 1 }}
                inverted={true}
                ItemSeparatorComponent={() => <Divider />}
                ListFooterComponent={() => (
                  <View>
                    <Text style={styles.title}>{i18n.t('activity_label')}</Text>
                    {loadingMore ? (
                      <View style={{ paddingVertical: 10 }}>
                        <ActivityIndicator color={colors.primary} />
                      </View>
                    ) : null}
                  </View>
                )}
                data={issueCommentsList}
                renderItem={renderItem}
                // onScroll={onScroll}
                onEndReached={onPaginate}
                scrollEventThrottle={16}
                onMomentumScrollBegin={() => {
                  loadMoreTriggeredRef.current = false;
                }}
                keyExtractor={(item, index) => String(item?.id ?? item?.due_date ?? index)}
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 24,
                }}
              >
                <Icon
                  type="ionicon"
                  name={
                    Platform.OS === 'ios'
                      ? 'chatbubble-ellipses-outline'
                      : 'chatbubble-ellipses-outline'
                  }
                  size={48}
                  color={colors.primary}
                  style={{ marginBottom: 16 }}
                />
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: colors.primary,
                    marginBottom: 8,
                  }}
                >
                  {i18n.t('nothing_to_show')}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    color: colors.secondary,
                    textAlign: 'center',
                    opacity: 0.7,
                  }}
                >
                  {i18n.t('information_not_available')}
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => {
                setTimeout(
                  () => commentsListRef.current?.scrollToIndex({ index: 0, animated: true }),
                  400
                );
              }}
              style={styles.floatingButton}
            >
              <Icon
                type="ionicon"
                style={{ marginTop: 2 }}
                color={colors.white}
                size={20}
                name={Platform.OS === 'ios' ? 'chevron-down' : 'chevron-down'}
              />
            </TouchableOpacity>

            {/* Added Reload Comments Button */}
            {newCommentsFlag && (
              <TouchableOpacity
                style={{ paddingVertical: 15, justifyContent: 'center', alignItems: 'center' }}
                onPress={handleReloadComments}
              >
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: 16,
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}
                >
                  {i18n.t('view_updates')}
                </Text>
              </TouchableOpacity>
            )}

            <View style={{ paddingBottom: 10 }}>
              <TextInput
                theme={theme}
                returnKeyType="done"
                onSubmitEditing={onPressSend}
                autoCapitalize="sentences"
                label={'Comment'}
                mode="flat"
                style={{
                  borderRadius: 20,
                  backgroundColor: colors.white,
                  fontSize: 14,
                  color: colors.secondary,
                }}
                onFocus={() =>
                  setTimeout(
                    () => commentsListRef.current?.scrollToIndex({ index: 0, animated: true }),
                    400
                  )
                }
                blurOnSubmit
                ref={commentInputRef}
                right={<TextInput.Icon onPress={onPressSend} name="send" color={colors.primary} />}
                onChangeText={setCommentText}
                value={commentText}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

export default Content;

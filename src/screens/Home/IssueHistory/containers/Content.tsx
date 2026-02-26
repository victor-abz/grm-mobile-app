import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, TouchableWithoutFeedback, Keyboard } from 'react-native';
import moment from 'moment';
import { styles } from './Content.styles';
import { i18n } from "../../../../translations/i18n";
import { Button, Dialog, Paragraph, Portal, Divider, TextInput } from 'react-native-paper';
import { colors } from '../../../../utils/colors';
import ImagePreviewCard from '../../CitizenReportStep2/containers/ImagePreviewCard';
import { useIssueComments } from "../../../../hooks/issues/useIssueComments";
import { useSelector } from 'react-redux';
import { IssueComment } from '../../../../models/issues/IssueComment';

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
  const { issueCommentsList, loading, createIssueComment } = useIssueComments(issue.id);
  const { profile, session } = useSelector((state: any) => state.get('authentication').toObject());
  const [commentText, setCommentText] = useState('');
  
  const commentInputRef = useRef(null)
  const commentsListRef = useRef(null)
  
  const [showDialog, setShowDialog] = useState(false);
  const [selected, setSelected] = useState(null);

  const _hideDialog = () => setShowDialog(false);
  const _showDialog = (_selected) => {
    setShowDialog(true);
    setSelected(_selected);
  };

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
  }
  const onPressSend = async () => {
    if (commentText.length === 0) return;
    const newComment: IssueComment = {
      id: undefined,
      parent_id: issue.id,
      user: {id: session.user_id ,name: profile?.user?.name},
      comment: commentText,
      due_date: new Date().toISOString(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };
    await createIssueComment(newComment);
    setCommentText('');
    commentInputRef.current?.blur();
    setTimeout(() => commentsListRef.current?.scrollToEnd({ animated: true }), 500);
  };

  return (
    <View style={styles.container}>
      <Portal>
        <Dialog visible={showDialog} onDismiss={_hideDialog}>
          <Dialog.Title>{selected?.name}</Dialog.Title>
          <Dialog.Content>
            <Paragraph>{selected?.comment}</Paragraph>
            <View style={styles.collapsibleContent}>
              {(selected?.attachment || selected?.recording) && (
                <View style={{ flexDirection: 'row', maxWidth: '100%', justifyContent: 'center' }}>
                  {selected?.attachment && selected?.attachment.local_url && (
                    <ImagePreviewCard
                      uri={selected.attachment.local_url}
                      id={selected.attachment.id}
                      showRemove={false}
                    />
                  )}
                  {selected?.recording && (
                    <RecordingCard mode="playback" initialURI={selected.recording.local_url} />
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
                ItemSeparatorComponent={() => <Divider />}
                ListHeaderComponent={() => (
                  <Text style={styles.title}>{i18n.t('activity_label')}</Text>
                )}
                data={issueCommentsList}
                renderItem={renderItem}
                keyExtractor={(item) => item.due_date}
              />
            ) : (
              <View style={{ flex: 1 }} />
            )}

            <View style={{ paddingBottom: 10 }}>
              <TextInput
                theme={theme}
                returnKeyType="done"
                onSubmitEditing={onPressSend}
                autoCapitalize="sentences"
                label={'Comment'}
                mode="flat"
                labelColor={colors.lightgray}
                style={{
                  borderRadius: 20,
                  backgroundColor: colors.white,
                  fontSize: 14,
                  color: colors.secondary,
                }}
                onFocus={() => setTimeout(() => commentsListRef.current?.scrollToEnd({ animated: true }), 500)}
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

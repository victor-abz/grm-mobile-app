import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import moment from 'moment';
import { styles } from './Content.styles';
import i18n from 'i18n-js';
import { Button, Dialog, Paragraph, Portal, Divider } from 'react-native-paper';
import { colors } from '../../../../utils/colors';

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
  const [comments, setComments] = useState();
  const [showDialog, setShowDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const loadComments = () => {
    const invertedComments = [...issue.comments];
    setComments(invertedComments?.sort((a, b) => new Date(b).getTime() - new Date(a).getTime()));
  };

  const _hideDialog = () => setShowDialog(false);
  const _showDialog = (_selected) => {
    setShowDialog(true);
    setSelected(_selected);
  };

  const renderItem = ({ item, index }) => (
    <View key={index} style={styles.commentCard}>
      <TouchableOpacity onPress={() => _showDialog(item)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
          <View style={styles.greenCircle} />
          <View>
            <Text style={styles.radioLabel}>{item.name}</Text>
          </View>
        </View>
        <Text style={styles.stepNote} numberOfLines={2}>{item.comment}</Text>
        <Text style={styles.dateLabel}>{moment(item.due_at).format('LLL')}</Text>
      </TouchableOpacity>
    </View>
  );

  const listHeader = () => <Text style={styles.title}>{i18n.t('activity_label')}</Text>;

  useEffect(() => {
    if (issue) {
      loadComments();
    }
  }, [issue]);

  const dividerItem = () => <Divider />;
  return (
    <View style={styles.container}>
      {comments?.length > 0 && (
        <FlatList
          ItemSeparatorComponent={dividerItem}
          ListHeaderComponent={listHeader}
          data={comments}
          renderItem={renderItem}
          keyExtractor={(item) => item.due_at}
        />
      )}

      <Portal>
        <Dialog visible={showDialog} onDismiss={_hideDialog}>
          <Dialog.Title>{selected?.name}</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              {selected?.comment}
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              theme={theme}
              style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              onPress={_hideDialog}>
              {i18n.t('close')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

export default Content;

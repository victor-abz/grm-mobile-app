import moment from 'moment';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, View } from 'react-native';
import { Button, Dialog, Paragraph, Portal, Text } from 'react-native-paper';
import UpdatableList from '../../../../components/UpdatableList';
import { colors } from '../../../../utils/colors';
import SectionList from '../components/NotificationItem/SectionList';
import { styles } from './Content.style';

const randomRange = (min, max) => Math.floor(Math.random() * (max - min)) + min;

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: '#dedede',
    text: '#707070',
  },
};
const generateMockData = (amount) => {
  const data = [];
  for (let i = 0; i < amount; i++) {
    const id = randomRange(0, 2000);
    const logo = randomRange(0, 3);
    const isRead = randomRange(0, 2);
    data.push({
      author: {
        id: 'ess',
        name: 'Test user',
      },
      title: 'Immatriculation de la plainte',
      description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
      id,
      issue_reference: '',
      isRead: !!isRead,
      date: moment.now(),
      type: 'notification',
    });
  }
  return [];
};

function Content() {
  const { t } = useTranslation();
  const [data, setData] = useState(generateMockData(10));
  const [selected, setSelected] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const _hideDialog = () => {
    onRead(selected);
    setShowDialog(false);
  };
  const _showDialog = (_selected) => {
    setShowDialog(true);
    setSelected(_selected);
  };

  const _hideConfirmDialog = () => {
    setSelected(null);
    setShowConfirmDialog(false);
  };
  const _showConfirmDialog = (_selected) => {
    setShowConfirmDialog(true);
    setSelected(_selected);
  };

  const removeItem = () => {
    const newData = [...data];
    const foundIndex = data.findIndex((x) => x.id === selected.id);
    newData.splice(foundIndex, 1);
    setData(newData);
    _hideConfirmDialog();
  };

  const onRead = (item) => {
    const foundIndex = data.findIndex((x) => x.id === item.id);
    const updatedData = data.slice();
    updatedData[foundIndex].isRead = true;
    setData(updatedData);
  };

  const handleFetchMoreData = async () => {
    try {
      await new Promise((res, _rej) => {
        const tout = setTimeout(() => {
          clearTimeout(tout);
          res();
        }, 1000);
      });
      setData((d) => d.concat(generateMockData(10)));
    } catch (error) {
      console.error(error);
    } finally {
      // pass
    }
  };

  /*  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ justifyContent: "center", alignItems: "center", flex: 1 }}>
        <Text style={{ color: colors.primary, fontWeight: "bold" }}>
          Upcoming feature.
        </Text>
      </View>
    </SafeAreaView>
  );
*/
  return (
    <>
      {!data || data.length === 0 ? (
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 22 }}>
              {t('no_notifications')}
            </Text>
          </View>
        </SafeAreaView>
      ) : (
        <UpdatableList
          // onFetchMoreData={handleFetchMoreData}
          contentContainerStyle={styles.listContent}
          data={data}
          keyExtractor={(_, i) => `item-${i}`}
          renderItem={({ item }) => (
            <SectionList {...item} onItemPress={_showDialog} onItemDelete={_showConfirmDialog} />
          )}
        />
      )}

      {/* DISPLAY NOTIFICATION DETAIL DIALOG */}
      <Portal>
        <Dialog visible={showDialog} onDismiss={_hideDialog}>
          <Dialog.Title>{selected?.title}</Dialog.Title>
          <Dialog.Content>
            <Paragraph>{selected?.description}</Paragraph>
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

      <Portal>
        <Dialog visible={showConfirmDialog} onDismiss={_hideConfirmDialog}>
          <Dialog.Title>{t('confirmation')}?</Dialog.Title>
          <Dialog.Content>
            <Paragraph>{t('confirm_deletion')}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              theme={theme}
              style={{
                alignSelf: 'center',
                backgroundColor: '#E74C3C',
                paddingLeft: 15,
                paddingRight: 15,
              }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={_hideConfirmDialog}
            >
              {t('no')}
            </Button>
            <Button
              theme={theme}
              style={{ alignSelf: 'center', margin: 24, paddingLeft: 15, paddingRight: 15 }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={removeItem}
            >
              {t('yes')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

export default Content;

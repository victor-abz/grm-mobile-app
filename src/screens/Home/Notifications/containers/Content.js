/* eslint-disable no-use-before-define */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  SafeAreaView,
  StyleSheet as RNStyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import dayjs from '../../../../utils/dayjs';
import UpdatableList from '../../../../components/UpdatableList';
import { colors } from '../../../../utils/colors';
import SectionList from '../components/NotificationItem/SectionList';
import { styles } from './Content.style';

const randomRange = (min, max) => Math.floor(Math.random() * (max - min)) + min;

const generateMockData = (amount) => {
  const data = [];
  for (let i = 0; i < amount; i++) {
    const id = randomRange(0, 2000);
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
      date: dayjs().valueOf(),
      type: 'notification',
    });
  }
  return data;
};

const Content = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(generateMockData(10));
  const [selected, setSelected] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const onRead = (item) => {
    const foundIndex = data.findIndex((x) => x.id === item.id);
    const updatedData = data.slice();
    updatedData[foundIndex].isRead = true;
    setData(updatedData);
  };

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

      {/* NOTIFICATION DETAIL MODAL */}
      <Modal
        visible={showDialog}
        transparent
        animationType="fade"
        onRequestClose={_hideDialog}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={_hideDialog}>
          <View style={dialogStyles.backdrop}>
            <TouchableWithoutFeedback>
              <View style={dialogStyles.card}>
                <View style={dialogStyles.header}>
                  <Text style={dialogStyles.title}>{selected?.title}</Text>
                </View>
                <View style={dialogStyles.body}>
                  <Text style={dialogStyles.content}>{selected?.description}</Text>
                </View>
                <View style={dialogStyles.footer}>
                  <TouchableOpacity
                    style={[dialogStyles.button, dialogStyles.secondaryButton]}
                    onPress={_hideDialog}
                    activeOpacity={0.8}
                  >
                    <Text style={[dialogStyles.buttonText, dialogStyles.secondaryButtonText]}>
                      {t('close')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <Modal
        visible={showConfirmDialog}
        transparent
        animationType="fade"
        onRequestClose={_hideConfirmDialog}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={_hideConfirmDialog}>
          <View style={dialogStyles.backdrop}>
            <TouchableWithoutFeedback>
              <View style={dialogStyles.card}>
                <View style={dialogStyles.header}>
                  <Text style={dialogStyles.title}>{t('confirmation')}</Text>
                </View>
                <View style={dialogStyles.body}>
                  <Text style={dialogStyles.content}>{t('confirm_deletion')}</Text>
                </View>
                <View style={dialogStyles.footer}>
                  <TouchableOpacity
                    style={[dialogStyles.button, dialogStyles.secondaryButton]}
                    onPress={_hideConfirmDialog}
                    activeOpacity={0.8}
                  >
                    <Text style={[dialogStyles.buttonText, dialogStyles.secondaryButtonText]}>
                      {t('no')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[dialogStyles.button, dialogStyles.destructiveButton]}
                    onPress={removeItem}
                    activeOpacity={0.8}
                  >
                    <Text style={[dialogStyles.buttonText, dialogStyles.destructiveButtonText]}>
                      {t('yes')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const dialogStyles = RNStyleSheet.create({
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
  content: { fontSize: 15, lineHeight: 22, color: '#555', fontFamily: 'Poppins_400Regular' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  secondaryButton: { backgroundColor: '#f0f0f0' },
  destructiveButton: { backgroundColor: '#fef2f2' },
  buttonText: { fontSize: 15, fontFamily: 'Poppins_500Medium' },
  secondaryButtonText: { color: '#666' },
  destructiveButtonText: { color: '#dc2626' },
});

export default Content;

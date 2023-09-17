import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ActivityIndicator, Card } from 'react-native-paper';
import { colors } from '../../../../utils/colors';

function ImagesList({ attachments }) {
  const { t } = useTranslation();

  const [_attachments, _setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  function AttachmentComponent({ attachment }) {
    return (
      <View
        key={attachment.id}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginVertical: 0,
          // backgroundColor: '#fff',
          marginBottom: 1,
          // justifyContent: 'space-around'
        }}
      >
        <Card style={styles.cardContainer}>
          <View style={styles.imageView}>
            {!attachment?.attachment?.isAudio ? (
              <Image
                style={styles.imageContainer}
                source={{
                  uri: attachment?.attachment?.local_url,
                }}
              />
            ) : (
              <Image
                style={styles.imageContainer}
                source={require('../../../../../assets/audio.png')}
              />
            )}
          </View>
          <View style={styles.textView}>
            <Text style={styles.cardTitle}>
              {t('reference')}: {attachment?.tracking_code}
            </Text>
            <Text style={styles.cardContent}>
              {!attachment.taskOrdinal &&
                `Fichier appartenant à un problème${
                  attachment?.attachment?.isAudio ? ' [Audio Recording].' : ' [Image].'
                }`}
              {attachment.taskOrdinal &&
                `Attachment on task ${attachment?.taskOrdinal} of \n phase ${attachment?.phaseOrdinal}`}
            </Text>
          </View>
        </Card>
      </View>
    );
  }
  useEffect(() => {
    setTimeout(() => {
      attachments?.length > 0 &&
        _setAttachments(
          attachments.map(
            (obj) => obj?.attachment?.uploaded === false && <AttachmentComponent attachment={obj} />
          )
        );
      setLoading(false);
    }, 500);
    return clearTimeout();
  }, [attachments]);
  if (loading)
    return (
      <View style={{ flex: 1 }}>
        <ActivityIndicator style={{ marginTop: 100 }} color={colors.primary} />
      </View>
    );
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ justifyContent: 'center', alignItems: 'center', padding: 10 }}
    >
      {_attachments}
    </ScrollView>
  );
}

export default React.memo(ImagesList);

const styles = StyleSheet.create({
  imageContainer: {
    width: 65,
    height: 65,
    borderRadius: 10,
    // margin: 10,
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    flex: 1,
    flexDirection: 'row',
    padding: 10,
    marginVertical: 5,
    borderColor: '#fff',
  },
  cardTitle: {
    fontWeight: 'bold',
  },
  cardContent: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    fontWeight: 'normal',
    fontStyle: 'normal',
    lineHeight: 16,
    letterSpacing: 0,
    textAlign: 'left',
    color: '#707070',
  },
  imageView: {
    flex: 1,
    flexDirection: 'column',
    left: 0,
    width: '20%',
  },
  textView: {
    flex: 1,
    flexDirection: 'column',
    position: 'absolute',
    right: 0,
    width: '80%',
  },
});

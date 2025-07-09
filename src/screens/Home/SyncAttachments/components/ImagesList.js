import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ActivityIndicator, Card } from 'react-native-paper';
import { colors } from '../../../../utils/colors';

function ImagesList({ attachments }) {
  const { t } = useTranslation();

  const [_attachments, _setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  function AttachmentComponent({ attachment }) {
    return (
      <View
        key={attachment.id}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginVertical: 0,
          marginBottom: 1,
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
                `${t('file_belonging_to_issue')}${
                  attachment?.attachment?.isAudio ? ' [Audio]' : ' [Image]'
                }`}
              {attachment.taskOrdinal &&
                `${t('attachment_on_task')} ${attachment?.taskOrdinal} ${t('of')} ${t('phase')} ${
                  attachment?.phaseOrdinal
                }`}
            </Text>
          </View>
        </Card>
      </View>
    );
  }

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      if (attachments?.length > 0) {
        _setAttachments(
          attachments
            .filter((obj) => obj?.attachment?.uploaded === false)
            .map((obj) => (
              <AttachmentComponent
                attachment={obj}
                key={obj.attachment.id || Math.random().toString()}
              />
            ))
        );
      } else {
        _setAttachments([]);
      }
      setLoading(false);
    }, 500);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
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
      {_attachments.length > 0 ? (
        _attachments
      ) : (
        <Text style={{ marginTop: 20, textAlign: 'center', color: '#707070' }}>
          {t('no_attachments_to_sync')}
        </Text>
      )}
    </ScrollView>
  );
}

export default React.memo(ImagesList);

const styles = StyleSheet.create({
  imageContainer: {
    width: 65,
    height: 65,
    borderRadius: 10,
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

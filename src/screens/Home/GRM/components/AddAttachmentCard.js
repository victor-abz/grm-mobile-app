import * as React from "react";
import { View, Text, Dimensions, StyleSheet, Platform } from "react-native";
import { colors } from '../../../../utils/colors';
import { Button, IconButton } from "react-native-paper";
const { width  } = Dimensions.get("screen");
import { i18n } from "../../../../translations/i18n";
import { Audio } from "expo-av";
import { useState } from "react";
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import RecordingCard from "./RecordingCard";
import ImagePreviewCard from "../../CitizenReportStep2/containers/ImagePreviewCard";

const AddAttachmentCard = ({ theme, onAttachmentChange }) => {
  const [showRecordingCard, setShowRecordingCard] = useState(false);
  const [attachment, setAttachment] = useState({});
  const [recordingURI, setRecordingURI] = useState();

  // Notify parent on change
  React.useEffect(() => {
    if (onAttachmentChange) {
      onAttachmentChange(attachment, recordingURI);
    }
  }, [attachment, recordingURI]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled) {
      let manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      setAttachment({ ...manipResult, id: new Date() });
    }
  };

  const openCamera = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled) {
      let manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      setAttachment({ ...manipResult, id: new Date() });
    }
  };

  return (
    <>
      <Text
        style={{
          fontFamily: 'Poppins_400Regular',
          fontSize: 12,
          fontWeight: 'normal',
          fontStyle: 'normal',
          lineHeight: 18,
          letterSpacing: 0,
          textAlign: 'left',
          color: '#707070',
          marginVertical: 13,
        }}
      >
        {i18n.t('step_2_share_photos')}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <Button
          theme={theme}
          style={{ alignSelf: 'center' }}
          labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
          mode="contained"
          onPress={pickImage}
          uppercase={false}
        >
          {i18n.t('step_2_upload_attachment')}
        </Button>
        <View style={styles.iconButtonStyle}>
          <IconButton icon="camera" color={colors.primary} size={24} onPress={openCamera} />
        </View>
        {!showRecordingCard && (
          <View style={styles.iconButtonStyle}>
            <IconButton
              icon="microphone"
              color={colors.primary}
              size={24}
              onPress={() => setShowRecordingCard(!showRecordingCard)}
            />
          </View>
        )}
      </View>
      {(showRecordingCard || recordingURI) && (
        <View style={{ flexDirection: 'row', maxWidth: '100%' }}>
          <RecordingCard
            mode="full"
            onRecordingSaved={uri => {
              setRecordingURI(uri);
              setShowRecordingCard(false);
            }}
          />
        </View>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        {attachment?.uri && (
          <ImagePreviewCard
            uri={attachment.uri}
            id={attachment.id}
            onRemove={() => setAttachment({})}
          />
        )}
      </View>
    </>
  );
};

export default AddAttachmentCard;

const styles = StyleSheet.create({
  error: {
    backgroundColor: 'red',
    height: 50,
    color: 'white',
    textAlign: 'center'
  },
  play: {
    borderWidth: .5,
    borderColor: "#c0c0c0",
    width: '15%',
    color: colors.primary
  },
  remove: {
    borderWidth: .5,
    borderColor: "#c0c0c0",
    width: '15%',
    color: colors.error
  },
  title: {
    fontWeight: '500',
    color: "black",
    fontSize: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: {
    fontSize: 15,
    color: '#fff'
  },
  img: {
    height: 250,
    width: width - 5,
    borderRadius: 5,
  },
  alignCenter: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  posts: {
    display: "flex",
    flexDirection: "column",
  },
  post: {
    width: width - 45,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#c0c0c0",
    display: "flex",
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 70,
    marginVertical: 10,
  },
  button: {
    borderColor: '#28BFFD',
    backgroundColor: '#28BFFD',
    height: 47,
    width: width - 25,
    borderWidth: 1,
    color: '#fff',
    fontSize: 16,
    borderRadius: 5,
  },
  iconButtonStyle: {
    alignSelf: 'center',
    marginLeft: 5,
  },
});
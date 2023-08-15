import * as React from "react";
import { View, Text, Dimensions, StyleSheet } from "react-native";
import { colors } from '../../../../utils/colors';
import { IconButton } from 'react-native-paper';
const { width  } = Dimensions.get("screen");
import i18n from 'i18n-js';

const RecordingCard = ({onPlay, onPause, onDelete, recording, onStopRecording, playing, current}) => (
  <View style={[styles.alignCenter, {marginTop: 15}]}>
    <View style={styles.post}>
      <View style={[styles.play, styles.alignCenter
          , {
            flexDirection: "column"
          }]}>
        {recording && (
          <IconButton size={35} color='#f80102' onPress={() => onStopRecording()} icon="record-circle-outline"/>
        )}

        {!recording && !playing && (
          <IconButton size={35} color={colors.primary} icon="play" onPress={() => onPlay()} />
        )}

        {!recording && playing && (
          <IconButton size={35} color={colors.primary} icon="pause" onPress={() => onPause()} />
        )}
      </View>

      <View style={[styles.alignCenter, {flexDirection: 'column', width: '70%'}]}>
        <Text style={styles.title}>{current}</Text>
        {recording && (<Text style={{color:colors.primary}}>{i18n.t('recording_in_progress')}</Text>)}
        {playing && (<Text style={{color:colors.primary}}>{i18n.t('playing_in_progress')}</Text>)}
      </View>

      {!recording && (
        <View
          style={[styles.remove, styles.alignCenter
            , {
              flexDirection: "column",
            }]}>
            <IconButton size={30} color='#f80102' onPress={() => onDelete()} icon="close"/>
        </View>
      )}

      <View />
    </View>
  </View>
)

export default RecordingCard;


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
});
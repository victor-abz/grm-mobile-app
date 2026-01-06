import React, { useState, useEffect } from 'react';
import {
  ImageBackground,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  NativeSyntheticEvent,
  ImageErrorEventData,
  View,
} from 'react-native';
import { colors } from '../../../../utils/colors';

const ImagePreviewCard = ({ uri, onRemove, id, showRemove = true, onRetry }) => {
  const [error, setError] = useState<NativeSyntheticEvent<ImageErrorEventData>>();

  const onRetryPress = () => {
    setError(null);
    onRetry();
  };

  useEffect(() => {
    Image.getSize(
      uri,
      () => {},
      (e) => {
        console.log(e);

        setError(e.message);
      }
    );
  }, []);

  if (!uri) return null;
  console.log('imagrePreviewCard.tsx - url', uri);
  return (
    <>
      <ImageBackground
        key={id}
        source={{ uri }}
        style={styles.image}
        onError={(e) => {
          setError(e);
        }}
      >
        {showRemove && (
          <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
            <Text style={{ color: 'white' }}>X</Text>
          </TouchableOpacity>
        )}
      </ImageBackground>

    </>
  );
};

const styles = StyleSheet.create({
  image: {
    height: 100,
    width: 100,
    margin: 5,
    marginTop: 20,
    alignSelf: 'center',
    justifyContent: 'flex-end',
  },
  removeButton: {
    alignItems: 'center',
    padding: 5,
    backgroundColor: 'rgba(36, 195, 139, 1)',
  },
});

export default ImagePreviewCard;

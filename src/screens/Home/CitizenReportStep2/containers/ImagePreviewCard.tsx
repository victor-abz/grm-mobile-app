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
      {/* 
      {error && (
        <>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: 'black', fontWeight: '700', marginBottom: 4 }}>
              Attachment failed to load
            </Text>
            <Text style={{ color: 'black', fontSize: 12, marginBottom: 8, textAlign: 'center' }}>
              The attachment couldn't be loaded. Tap Retry to attempt reload or Remove to delete
              this attachment.
            </Text>

            {showRemove && (
              <TouchableOpacity
                onPress={onRemove}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  borderRadius: 4,
                  marginBottom: 6,
                  alignSelf: 'center',
                }}
                accessibilityRole="button"
                accessibilityLabel="Remove attachment"
              >
                <Text style={{ color: 'black' }}>Remove</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                backgroundColor: colors.lightgray,
                borderRadius: 4,
                marginBottom: 6,
                alignSelf: 'center',
              }}
              onPress={onRetryPress}
            >
              <Text>Retry</Text>
            </TouchableOpacity>
          </View>
        </>
      )} */}
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

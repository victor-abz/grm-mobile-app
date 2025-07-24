import React from 'react';
import { ImageBackground, TouchableOpacity, Text, StyleSheet } from 'react-native';

const ImagePreviewCard = ({ uri, onRemove, id, showRemove = true }) => {
  if (!uri) return null;
  return (
    <ImageBackground
      key={id}
      source={{ uri }}
      style={styles.image}
    >
      {showRemove && (
        <TouchableOpacity
          onPress={onRemove}
          style={styles.removeButton}
        >
          <Text style={{ color: 'white' }}>X</Text>
        </TouchableOpacity>
      )}
    </ImageBackground>
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
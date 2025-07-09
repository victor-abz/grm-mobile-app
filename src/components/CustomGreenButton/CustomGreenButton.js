import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';

const CustomGreenButton = ({
  children,
  title,
  buttonStyle,
  style,
  textStyle,
  onPress,
  disabled = false,
  loading = false,
}) => {
  const buttonText = title || children;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        {
          minWidth: 120,
          minHeight: 40,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 8,
          backgroundColor: disabled ? '#cccccc' : '#24c38b',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
        },
        buttonStyle,
        style,
      ]}
    >
      {loading && <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />}
      <Text
        style={[
          {
            fontFamily: 'Poppins_700Bold',
            fontSize: 14,
            fontWeight: 'bold',
            fontStyle: 'normal',
            lineHeight: 20,
            letterSpacing: 0,
            textAlign: 'center',
            color: '#ffffff',
          },
          textStyle,
        ]}
      >
        {buttonText}
      </Text>
    </TouchableOpacity>
  );
};

export default CustomGreenButton;

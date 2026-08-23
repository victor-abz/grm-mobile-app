import React from 'react'
import { View, ActivityIndicator } from 'react-native';

type Props = {}

const CustomLoadingSpinner = (props: Props) => {
  return (
    <View style={{flex: 1, justifyContent: "center"}}>
      <ActivityIndicator size="small" color="#24c38b" />
    </View>
  );
}

export default CustomLoadingSpinner;
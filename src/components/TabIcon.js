import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../utils/colors';

const TabIcon = ({ status, currentStatus, label, fontSize }) => (
  <View>
    <Text
      style={{
        color: currentStatus === status ? colors.primary : colors.secondary,
        fontWeight: currentStatus === status ? 'bold' : 'normal',
        fontSize,
      }}
    >
      {label}
    </Text>
  </View>
);

export default TabIcon;

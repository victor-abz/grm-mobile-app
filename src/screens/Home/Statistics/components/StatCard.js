import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../../utils/colors';

const screenWidth = Dimensions.get('window').width;

function StatCard({ title, value, icon, color = colors.primary, subtitle }) {
  return (
    <Card
      style={{
        width: (screenWidth - 48) / 2, // Two cards per row with margins
        marginBottom: 12,
        borderRadius: 12,
        elevation: 2,
        backgroundColor: 'white',
      }}
    >
      <Card.Content style={{ padding: 16 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <MaterialCommunityIcons name={icon} size={24} color={color} style={{ marginRight: 8 }} />
          <Text
            style={{
              fontSize: 12,
              color: colors.secondary,
              fontWeight: '500',
              flex: 1,
            }}
          >
            {title}
          </Text>
        </View>

        <Text
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: color,
            marginBottom: 4,
          }}
        >
          {value}
        </Text>

        {subtitle && (
          <Text
            style={{
              fontSize: 10,
              color: colors.placeholder,
              lineHeight: 12,
            }}
          >
            {subtitle}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}

export default StatCard;

import React from 'react';
import { View, Text } from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../../utils/colors';

const StatCard = ({ title, value, icon, color, subtitle, trend, trendLabel }) => {
  const getTrendColor = (trendValue) => {
    if (!trendValue || trendValue === 0) return colors.secondary;
    return trendValue > 0 ? '#2ecc71' : '#e74c3c';
  };

  const getTrendIcon = (trendValue) => {
    if (!trendValue || trendValue === 0) return '•';
    return trendValue > 0 ? '▲' : '▼';
  };

  return (
    <Card
      style={{
        width: '48%',
        marginBottom: 16,
        borderRadius: 12,
        elevation: 2,
      }}
    >
      <Card.Content>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <MaterialCommunityIcons name={icon} size={24} color={color} />
          <Text style={{ marginLeft: 8, fontSize: 14, color: colors.secondary, flex: 1 }}>
            {title}
          </Text>
        </View>

        <Text style={{ fontSize: 24, fontWeight: 'bold', color: color, marginBottom: 4 }}>
          {value}
        </Text>

        <Text style={{ fontSize: 12, color: colors.secondary, marginBottom: trend ? 4 : 0 }}>
          {subtitle}
        </Text>

        {trend !== undefined && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text
              style={{
                fontSize: 12,
                color: getTrendColor(trend),
                fontWeight: 'bold',
              }}
            >
              {getTrendIcon(trend)} {Math.abs(trend).toFixed(1)}%
            </Text>
            {trendLabel && (
              <Text style={{ fontSize: 12, color: colors.secondary, marginLeft: 4 }}>
                {trendLabel}
              </Text>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

export default StatCard;

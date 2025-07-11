import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { StackedBarChart } from 'react-native-chart-kit';
import { colors } from '../../../../utils/colors';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  fillShadowGradientOpacity: 1,
  fillShadowGradient: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  barPercentage: 0.8,
  propsForLabels: {
    fontSize: 10,
  },
  propsForBackgroundLines: {
    strokeDasharray: '',
  },
};

const getChartColor = (index) => {
  const chartColors = [
    '#24c38b',
    '#3498db',
    '#e74c3c',
    '#f39c12',
    '#9b59b6',
    '#1abc9c',
    '#34495e',
    '#95a5a6',
    '#e67e22',
    '#2ecc71',
  ];
  return chartColors[index % chartColors.length];
};

const StackedBarChartGrm = ({ data, labels }) => {
  if (!data || !labels || labels.length === 0) {
    return (
      <View style={{ alignItems: 'center', padding: 20 }}>
        <Text style={{ color: colors.secondary }}>No data available</Text>
      </View>
    );
  }

  console.log('📊 [CHART] Rendering with data:', { data, labels });

  // Get all categories/types
  const keys = Object.keys(data);

  // Transform data for stacked bar chart
  const chartData = {
    labels,
    legend: keys,
    data: labels.map((_, monthIndex) => keys.map((key) => data[key][monthIndex] || 0)),
    barColors: keys.map((_, index) => getChartColor(index)),
  };

  console.log('📊 [CHART] Transformed data:', chartData);

  return (
    <View style={{ marginVertical: 8 }}>
      <StackedBarChart
        data={chartData}
        width={screenWidth - 64}
        height={220}
        chartConfig={chartConfig}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
        withHorizontalLabels={true}
        showValuesOnTopOfBars={false}
        hideLegend={true}
      />

      {/* Custom Legend */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginTop: 16,
          justifyContent: 'center',
          paddingHorizontal: 8,
        }}
      >
        {keys.map((label, index) => (
          <View
            key={label}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginRight: 16,
              marginBottom: 8,
              minWidth: 100,
            }}
          >
            <View
              style={{
                width: 12,
                height: 12,
                backgroundColor: getChartColor(index),
                borderRadius: 6,
                marginRight: 4,
              }}
            />
            <Text style={{ fontSize: 12, color: colors.secondary, flex: 1 }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default StackedBarChartGrm;

import React from 'react';
import { Dimensions, View, Text, ScrollView } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

/**
 * Custom X-axis with rotated labels to avoid overlapping.
 */
function RotatedXAxisLabels({ labels, chartWidth }) {
  // Calculate the space for each bar
  const barWidth = chartWidth / labels.length;

  return (
    <View
      style={{
        flexDirection: 'row',
        position: 'absolute',
        bottom: 0,
        left: 10,
        width: chartWidth,
        height: 36,
      }}
      pointerEvents="none"
    >
      {labels.map((label, idx) => (
        <View
          key={idx}
          style={{
            width: barWidth,
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          <Text
            numberOfLines={2}
            style={{
              fontSize: 10,
              color: '#555',
              transform: [{ rotate: '-25deg' }],
              textAlign: 'right',
              width: barWidth + 24,
              marginLeft: -12,
            }}
          >
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function BarChartGrm({ labelNames, dataValue, yAxisLabel }) {
  // Set minimal width per data point to make horizontal scroll for lots of data
  const screenWidth = Dimensions.get('window').width;
  const BAR_WIDTH_MIN = 42;
  const containerPadding = 16; // should match the parent padding
  const computedWidth = Math.max(screenWidth - containerPadding, labelNames.length * BAR_WIDTH_MIN);

  // Show all labels (no label reduction); let the user scroll horizontally if needed

  return (
    <View style={{ paddingBottom: 40 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        style={{ width: '100%'}}
        contentContainerStyle={{
          minWidth: screenWidth - containerPadding,
          justifyContent:
            labelNames.length * BAR_WIDTH_MIN <= screenWidth - containerPadding
              ? 'center'
              : 'flex-start',
        }}
      >
        <View style={{ width: computedWidth }}>
          <BarChart
            data={{
              labels: labelNames,
              datasets: [
                {
                  data: dataValue,
                },
              ],
            }}
            width={computedWidth}
            height={220}
            yAxisLabel={yAxisLabel}
            chartConfig={{
              backgroundColor: '#1cc910',
              backgroundGradientFrom: '#eff3ff',
              backgroundGradientTo: '#eff3ff',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForLabels: {
                fontSize: 10,
                rotation: -25,
              },
              propsForBackgroundLines: {
                strokeDasharray: '', // solid lines
              },
            }}
            withHorizontalLabels
            withVerticalLabels
            showValuesOnTopOfBars={true}
            style={{
              paddingVertical: 18,
              backgroundColor: '#eff3ff',
              borderRadius: 16,

            }}
            fromZero
          />
          {/* {labelNames.length > 2 && (
             <RotatedXAxisLabels labels={labelNames} chartWidth={computedWidth} />
          )} */}
        </View>
      </ScrollView>
    </View>
  );
}

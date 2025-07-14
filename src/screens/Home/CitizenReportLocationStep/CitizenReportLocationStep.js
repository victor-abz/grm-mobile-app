import React, { useContext } from 'react';
import { SafeAreaView, ScrollView, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { DataContext } from '../../../providers/DataProvider';
import { styles } from './CitizenReportLocationStep.styles';
// eslint-disable-next-line import/no-named-as-default
import Content from './containers/Content';

const CitizenReportLocationStep = ({ route }) => {
  const { params } = route;
  const { isDataInitialized, isLoading } = useContext(DataContext);

  const customStyles = styles();

  // Show loading state while data is initializing
  if (!isDataInitialized || isLoading) {
    return (
      <SafeAreaView style={customStyles.container}>
        <ScrollView
          style={{
            backgroundColor: 'white',
            flex: 1,
          }}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View
            style={{
              zIndex: 20,
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator size="large" color="#24c38b" />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={customStyles.container}>
      <Content stepOneParams={params.stepOneParams} stepTwoParams={params.stepTwoParams} />
    </SafeAreaView>
  );
};

export default CitizenReportLocationStep;

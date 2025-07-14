import React from 'react';
import { SafeAreaView } from 'react-native';
import Content from './containers/Content';
import { styles } from './CitizenReportStep4.styles';

const CitizenReportStep4 = ({ route, navigation }) => {
  const customStyles = styles();

  return (
    <SafeAreaView style={customStyles.container}>
      <Content route={route} navigation={navigation} />
    </SafeAreaView>
  );
};

export default CitizenReportStep4;

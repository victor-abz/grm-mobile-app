import React from 'react';
import { SafeAreaView } from 'react-native';
import Content from './containers/Content';
import { styles } from './CitizenReport.styles';

const CitizenReport = ({ route }) => {
  const customStyles = styles();
  const { selectedProject } = route?.params || {};

  return (
    <SafeAreaView style={customStyles.container}>
      <Content selectedProject={selectedProject} />
    </SafeAreaView>
  );
};

export default CitizenReport;

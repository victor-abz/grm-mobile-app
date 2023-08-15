import React from 'react';
import { SafeAreaView } from 'react-native';
import { styles } from './CitizenReportContactInfo.styles';
import Content from './containers/Content';

function CitizenReportContactInfo({ route }) {
  const customStyles = styles();
  const { params } = route;

  return (
    <SafeAreaView style={customStyles.container}>
      <Content
        stepOneParams={params.stepOneParams}
      />
    </SafeAreaView>
  );
}

export default CitizenReportContactInfo;

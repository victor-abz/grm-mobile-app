import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { useSelector } from 'react-redux';
import Content from './containers/Content';
import { styles } from './CitizenReportStep3.styles';

function CitizenReportStep3({ route }) {
  const { params } = route;
  const customStyles = styles();
  const { session } = useSelector((state) => state.get('authentication').toObject());
  
  return (
    <SafeAreaView style={customStyles.container}>
      <Content
        session={session}
        issue={{
          ...params.stepOneParams,
          ...params.stepTwoParams,
          ...params.stepLocationParams,
        }}
      />
    </SafeAreaView>
  );
}

export default CitizenReportStep3;

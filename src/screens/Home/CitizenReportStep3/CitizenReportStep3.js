import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { useSelector } from 'react-redux';
import { ActivityIndicator } from 'react-native-paper';
import Content from './containers/Content';
import { styles } from './CitizenReportStep3.styles';
import { useIssueStatus } from '../../../hooks/issues/useIssueStatus';
import { colors } from '../../../utils/colors';

function CitizenReportStep3({ route }) {
  const { params } = route;
  const customStyles = styles();
  const { session, profile } = useSelector((state) => state.get('authentication').toObject());
  const { getStatus, loading } = useIssueStatus();
  const openStatus = getStatus('open_status');
  
  if (loading)
      return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" />;

  return (
    <SafeAreaView style={customStyles.container}>
      <Content
        session={session}
        profile={profile}
        issue={{
          ...params.stepOneParams,
          ...params.stepTwoParams,
          ...params.stepLocationParams,
          status: openStatus
        }}
      />
    </SafeAreaView>
  );
}

export default CitizenReportStep3;

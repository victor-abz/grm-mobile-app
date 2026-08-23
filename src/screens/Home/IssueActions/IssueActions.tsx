import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { useSelector } from 'react-redux';
import CustomLoadingSpinner from '../../../components/CustomLoadingSpinner/CustomLoadingSpinner';
import { useIssue } from '../../../hooks/issues/useIssue';
import { useIssueStatus } from '../../../hooks/issues/useIssueStatus';
import Content from './containers/Content';
import { styles } from './IssueActions.styles';

function IssueActions({ route, navigation }) {
  const { params } = route;
  const { issueStatusList, loading: statusListLoading, getStatus } = useIssueStatus();
  const { updateIssue } = useIssue();
  const [loading, setLoading] = useState<boolean>(false);
  const customStyles = styles();
  const { session, profile } = useSelector((state) => state.get('authentication').toObject());

  useEffect(() => {
    if (statusListLoading) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [statusListLoading]);

  if (loading) {
    return (
      <CustomLoadingSpinner />
    );
  }

  return (
    <SafeAreaView style={customStyles.container}>
      <Content
        loading={loading}
        session={session}
        profile={profile}
        currentIssue={params.item}
        navigation={navigation}
        statuses={issueStatusList}
        updateIssue={updateIssue}
        getStatus={getStatus}
      />
    </SafeAreaView>
  );
}

export default IssueActions;

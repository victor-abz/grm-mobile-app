import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { useSelector } from 'react-redux';
import { ActivityIndicator } from 'react-native-paper';
import Content from './containers';
import { styles } from './IssueSearch.style';
import { LocalAdminLevelsDatabase } from '../../../db/databaseManager';
import { colors } from '../../../utils/colors';
import { useIssueStatus } from '../../../hooks/issues/useIssueStatus';

import { useIssue } from '../../../hooks/issues/useIssue';

function IssueSearch() {
  const customStyles = styles();
  const { assigneeIssueList, reporterIssueList, loading: issueListLoading } = useIssue();
  const { issueStatusList, loading } = useIssueStatus();

  if (issueListLoading) return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" />;

  return (
    <SafeAreaView style={customStyles.container}>
      <Content assigneeIssueList={assigneeIssueList} reporterIssueList={reporterIssueList} statuses={issueStatusList} />
    </SafeAreaView>
  );
}

export default IssueSearch;

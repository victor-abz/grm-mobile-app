import React from 'react';
import { SafeAreaView } from 'react-native';
import Content from './containers';
import { styles } from './IssueSearch.style';
import { useIssueStatus } from '../../../hooks/issues/useIssueStatus';

import { useIssue } from '../../../hooks/issues/useIssue';
import { useSelector } from 'react-redux';

function IssueSearch() { 
  const customStyles = styles();
  const {
    fetchMoreReporterIssueList,
    fetchMoreAssigneeIssueList,
    fetchMoreResolvedIssueList,
    assigneeIssueList,
    reporterIssueList,
    loading: issueListLoading,
  } = useIssue();
  const { issueStatusList, loading, getStatusById } = useIssueStatus();
  const { session, profile } = useSelector((state) => state.get('authentication').toObject());

  if (assigneeIssueList) {
    assigneeIssueList.forEach((item, index) => {
      const element = { ...item };

      if (typeof element.assignee === 'string' && element.assignee === session.user_id) {
        element.assignee = { id: session.user_id, name: profile?.user?.name };
      }
      if (typeof element.reporter === 'string' && element.reporter === session.user_id) {
        element.reporter = { id: session.user_id, name: profile?.user?.name };
      }
      if (typeof element.status === 'string') {
        element.status = getStatusById(element.status);
      }

      assigneeIssueList[index] = element;
    });
  }
  
  if (reporterIssueList) {
    reporterIssueList.forEach((item, index) => {
      const element = { ...item };

      if (typeof element.assignee === 'string' && element.assignee === session.user_id) {
        element.assignee = { id: session.user_id, name: profile?.user?.name };
      }
      if (typeof element.reporter === 'string' && element.reporter === session.user_id) {
        element.reporter = { id: session.user_id, name: profile?.user?.name };
      }
      if (typeof element.status === 'string') {
        element.status = getStatusById(element.status);
      }

      reporterIssueList[index] = element;
    });
  }

  return (
    <SafeAreaView style={customStyles.container}>
      <Content
        fetchMoreAssigneeIssueList={fetchMoreAssigneeIssueList}
        fetchMoreReporterIssueList={fetchMoreReporterIssueList}
        fetchMoreResolvedIssueList={fetchMoreResolvedIssueList}
        assigneeIssueList={assigneeIssueList}
        reporterIssueList={reporterIssueList}
        statuses={issueStatusList}
        issueListLoading={issueListLoading}
      />
    </SafeAreaView>
  );
}

export default IssueSearch;

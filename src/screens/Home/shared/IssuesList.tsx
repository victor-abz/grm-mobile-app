import React from 'react';
import { SafeAreaView } from 'react-native';
import IssueListView from './containers';
import { styles } from './IssueList.style';
import { useIssueStatus } from '../../../hooks/issues/useIssueStatus';

import { useIssue } from '../../../hooks/issues/useIssue';
import { useSelector } from 'react-redux';

function IssueList({ assigneeIssueList, reporterIssueList }) {
  const customStyles = styles();
  const {
    fetchMoreReporterIssueList,
    fetchMoreAssigneeIssueList,
    fetchMoreResolvedIssueList,
    loading,
  } = useIssue();
  const { issueStatusList, getStatusById } = useIssueStatus();
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
    <SafeAreaView style={[customStyles.container, { flex: 1 }]}>
      <IssueListView
        fetchMoreAssigneeIssueList={fetchMoreAssigneeIssueList}
        fetchMoreReporterIssueList={fetchMoreReporterIssueList}
        fetchMoreResolvedIssueList={fetchMoreResolvedIssueList}
        assigneeIssueList={assigneeIssueList}
        reporterIssueList={reporterIssueList}
        statuses={issueStatusList}
        issueListLoading={loading}
      />
    </SafeAreaView>
  );
}

export default IssueList;

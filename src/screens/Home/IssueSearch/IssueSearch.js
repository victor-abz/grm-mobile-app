import React from 'react';
import { SafeAreaView } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useAllDocs, useView } from 'use-pouchdb';
import { colors } from '../../../utils/colors';
import { styles } from './IssueSearch.style';
import Content from './containers';

function IssueSearch() {
  const customStyles = styles();
  const { username } = useSelector((state) => state.get('authentication').toObject());

  const { rows, loading, state, error } = useAllDocs({
    include_docs: true,
    db: 'LocalGRMDatabase',
  });

  if (state === 'error') {
    console.log('Error', state);
  }

  const { rows: representative, loading: eadlLoading } = useView('eadl/by_representative_email', {
    key: username,
    include_docs: true,
    db: 'LocalCommunesDatabase',
  });

  const eadl = representative.map((d) => d.doc);

  const { rows: issue_status, loading: statusesLoading } = useView('issues/by_type', {
    db: 'LocalGRMDatabase',
    key: 'issue_status',
    include_docs: true,
  });
  const statuses = issue_status.map((d) => d.doc);

  const { rows: grmIssues, loading: issuesLoading } = useView('issues/by_type_and_user', {
    startkey: ['issue', eadl?.[0]?._id],
    endkey: ['issue', eadl?.[0]?._id, {}],
    include_docs: true,
    db: 'LocalGRMDatabase',
  });
  const issues = grmIssues.map((r) => r.doc);

  if (!issues || !eadl || !statuses || issuesLoading || statusesLoading || eadlLoading) {
    return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" />;
  }
  return (
    <SafeAreaView style={customStyles.container}>
      <Content issues={issues} eadl={eadl?.[0]} statuses={statuses} />
    </SafeAreaView>
  );
}

export default IssueSearch;

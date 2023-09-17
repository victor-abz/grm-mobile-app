import React from 'react';
import { SafeAreaView } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useAllDocs, useFind } from 'use-pouchdb';
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

  const { docs: eadl, loading: eadlLoading } = useFind({
    selector: { 'representative.email': username },
    db: 'LocalDatabase',
  });

  const { docs: statuses, loading: statusesLoading } = useFind({
    selector: {
      type: 'issue_status',
    },
    db: 'LocalGRMDatabase',
  });

  const { docs: issues, loading: issuesLoading } = useFind({
    selector: {
      type: 'issue',
      $or: [
        { 'reporter.name': eadl?.[0]?.representative?.name },
        { 'assignee.name': eadl?.[0]?.representative?.name },
      ],
    },
    db: 'LocalGRMDatabase',
  });

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

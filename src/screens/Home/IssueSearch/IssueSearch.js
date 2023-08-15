import React from 'react';
import { SafeAreaView } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useFind } from 'use-pouchdb';
import { colors } from '../../../utils/colors';
import { styles } from './IssueSearch.style';
import Content from './containers';

function IssueSearch() {
  const customStyles = styles();
  const { username } = useSelector((state) => state.get('authentication').toObject());

  const { docs: eadl, loading: eadlLoading } = useFind({
    index: {
      fields: ['representative.email'],
    },
    selector: { 'representative.email': username },
    db: 'LocalDatabase',
  });

  const { docs: statuses, loading: statusesLoading } = useFind({
    index: {
      fields: ['type'],
    },
    selector: {
      type: 'issue_status',
    },
    db: 'LocalGRMDatabase',
  });

  const { docs: issues, loading: issuesLoading } = useFind({
    index: {
      fields: ['type'],
    },
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

import React from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useFind } from 'use-pouchdb';
import { colors } from '../../../utils/colors';
import { styles } from './SearchBarGrm.style';
import Content from './containers';

function SearchBarGrm() {
  const { username } = useSelector((state) => state.get('authentication').toObject());

  const { docs: eadl, loading: eadlLoading } = useFind({
    selector: { 'representative.email': username },
    db: 'LocalDatabase',
  });

  const { docs: issues, loading: issuesLoading } = useFind({
    selector: {
      type: 'issue',
      $or: [{ 'reporter.id': eadl?.[0]?._id }, { 'assignee.id': eadl?.[0]?._id }],
    },
    db: 'LocalGRMDatabase',
  });

  if (!issues || !eadl || issuesLoading || eadlLoading) {
    return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Content issues={issues} eadl={eadl?.[0]} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default SearchBarGrm;

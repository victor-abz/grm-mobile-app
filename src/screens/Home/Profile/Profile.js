import React from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { useFind } from 'use-pouchdb';
import { styles } from './Profile.style';
import Content from './containers';
import { ActivityIndicator } from 'react-native-paper';
import { colors } from '../../../utils/colors';

function Profile() {
  const { username } = useSelector((state) => state.get('authentication').toObject());

  const { docs: statuses, loading: statusesLoading } = useFind({
    selector: { type: 'issue_status' },
    db: 'LocalGRMDatabase',
  });

  const { docs: eadl, loading: eadlLoading } = useFind({
    selector: { 'representative.email': username },
    db: 'LocalDatabase',
  });

  const { docs: department, loading: departmentLoading } = useFind({
    selector: {
      type: 'issue_department',
      id: eadl?.[0]?.department,
    },
    db: 'LocalGRMDatabase',
  });
  const { docs: issues, loading: issuesLoading } = useFind({
    selector: {
      type: 'issue',
      $or: [{ 'reporter.id': eadl?.[0]?._id }, { 'assignee.id': eadl?.[0]?._id }],
    },
    db: 'LocalGRMDatabase',
  });


  if (!issues || !eadl || issuesLoading || statusesLoading || eadlLoading || departmentLoading) {
    return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Content issues={issues} eadl={eadl?.[0]} department={department} statuses={statuses} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default Profile;

import React from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useView } from 'use-pouchdb';
import { colors } from '../../../utils/colors';
import { styles } from './Profile.style';
import Content from './containers';

function Profile() {
  const { username } = useSelector((state) => state.get('authentication').toObject());

  const { rows: issue_status, loading: statusesLoading } = useView('issues/by_type', {
    db: 'LocalGRMDatabase',
    key: 'issue_status',
    include_docs: true,
  });
  const statuses = issue_status.map((d) => d.doc);

  const { rows: representative, loading: eadlLoading } = useView('eadl/by_representative_email', {
    key: username,
    include_docs: true,
    db: 'LocalCommunesDatabase',
  });

  const eadl = rows.map((d) => d.doc);

  const { rows: issue_department, loading: departmentLoading } = useView('issues/by_type_and_id', {
    startkey: ['issue_department', eadl?.[0]?.department],
    endkey: ['issue_department', eadl?.[0]?.department, {}],
    include_docs: true,
    db: 'LocalGRMDatabase',
  });
  const department = issue_department.map((d) => d.doc);

  const { rows: grmIssues, loading: issuesLoading } = useView('issues/by_type_and_user', {
    startkey: ['issue', eadl?.[0]?._id],
    endkey: ['issue', eadl?.[0]?._id, {}],
    include_docs: true,
    db: 'LocalGRMDatabase',
  });

  const issues = grmIssues.map((r) => r.doc);

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

import React from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { colors } from '../../../utils/colors';
import { styles } from './SearchBarGrm.style';
import Content from './containers';

function SearchBarGrm() {
  const { username } = useSelector((state) => state.get('authentication').toObject());

  const { rows: representative, loading: eadlLoading } = useView('issues/by_representative_email', {
    key: username,
    include_docs: true,
    db: 'LocalDatabase',
  });

  const eadl = representative.map((d) => d.doc);

  const { rows: all_issues, loading: issuesLoading } = useView('issues/by_type_and_id', {
    startkey: ['issue', eadl?.[0]?._id],
    endkey: ['issue', eadl?.[0]?._id, {}],
    include_docs: true,
    db: 'LocalGRMDatabase',
  });
  const issues = all_issues.map((d) => d.doc);

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

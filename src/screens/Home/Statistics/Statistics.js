import React, { useMemo, useCallback } from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useView } from 'use-pouchdb';
import { colors } from '../../../utils/colors';
import { styles } from './Statistics.style';
import Content from './containers';

const ITEMS_PER_PAGE = 20; // Adjust as needed

function Statistics() {
  const customStyles = styles();
  const { username } = useSelector((state) => state.get('authentication').toObject());

  const { rows: allIssueTypes, loading: allIssueTypesLoading } = useView('issues/all_issue_types', {
    db: 'LocalGRMDatabase',
    include_docs: true,
  });

  const { rows: representative, loading: eadlLoading } = useView('eadl/by_representative_email', {
    key: username,
    include_docs: true,
    db: 'LocalCommunesDatabase',
  });

  const eadl = useMemo(() => representative.map((d) => d.doc), [representative]);

  const { rows, loading: issuesLoading } = useView('issues/by_type_and_user', {
    startkey: ['issue', eadl?.[0]?._id],
    endkey: ['issue', eadl?.[0]?._id, {}],
    include_docs: true,
    // limit: ITEMS_PER_PAGE,
    db: 'LocalGRMDatabase',
  });

  const issues = useMemo(() => rows.map((r) => r.doc), [rows]);

  const groupedIssueTypes = useMemo(() => {
    const grouped = {};
    allIssueTypes.forEach((row) => {
      const [type] = row.key;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(row.doc);
    });
    return grouped;
  }, [allIssueTypes]);

  const isLoading = useCallback(() => {
    return !issues || !eadl || issuesLoading || eadlLoading || allIssueTypesLoading;
  }, [issues, eadl, issuesLoading, eadlLoading, allIssueTypesLoading]);

  if (isLoading()) {
    return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" />;
  }

  return (
    <SafeAreaView style={customStyles.container}>
      <ScrollView>
        <Content
          issues={issues}
          eadl={eadl?.[0]}
          statuses={groupedIssueTypes.issue_status || []}
          ageGroup={groupedIssueTypes.issue_age_group || []}
          citizenGroup1={groupedIssueTypes.issue_citizen_group_1 || []}
          citizenGroup2={groupedIssueTypes.issue_citizen_group_2 || []}
          issueType={groupedIssueTypes.issue_type || []}
          issueCategory={groupedIssueTypes.issue_category || []}
          issueComponent={groupedIssueTypes.issue_component || []}
          issueSubComponent={groupedIssueTypes.issue_sub_component || []}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

export default React.memo(Statistics);
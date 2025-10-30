import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { useSelector } from 'react-redux';
import { ActivityIndicator } from 'react-native-paper';
import Content from './containers';
import { styles } from './IssueSearch.style';
import { LocalAdminLevelsDatabase } from '../../../db/databaseManager';
import { colors } from '../../../utils/colors';
import { useIssueStatus } from '../../../hooks/issues/useIssueStatus';

import { useIssue } from '../../../hooks/issues/useIssue';

function IssueSearch() {
  const customStyles = styles();
  const { assigneeIssueList, reporterIssueList, loading: issueListLoading } = useIssue();

  const { issueStatusList, loading } = useIssueStatus();
  const [eadl, setEadl] = useState(false);
  const { session } = useSelector((state) => state.get('authentication').toObject());
  const username = session?.username ?? ''

  //fetch user + facilitator
  useEffect(() => {
    if (username) {
      LocalAdminLevelsDatabase.find({
        selector: { 'representative.email': username },
        // fields: ["_id", "commune", "phases"],
      })
        .then((result) => {
          setEadl(result.docs[0]);

          // handle result
        })
        .catch((err) => {
          console.log('ERROR FETCHING EADL', err);
        });
    }
  }, [username]);


  if (issueListLoading) return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" />;

  return (
    <SafeAreaView style={customStyles.container}>
      <Content assigneeIssueList={assigneeIssueList} reporterIssueList={reporterIssueList} eadl={eadl} statuses={issueStatusList} />
    </SafeAreaView>
  );
}

export default IssueSearch;

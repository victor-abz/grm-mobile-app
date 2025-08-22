import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { useSelector } from 'react-redux';
import { ActivityIndicator } from 'react-native-paper';
import Content from './containers';
import { styles } from './IssueSearch.style';
import { LocalAdminLevelsDatabase, LocalGRMDatabase } from '../../../db/databaseManager';
import { colors } from '../../../utils/colors';
import { useIssueStatus } from '../../../services/hooks/useIssueStatus';

function IssueSearch() {
  const customStyles = styles();
  const [issues, setIssues] = useState();
  const { issueStatusList, loading } = useIssueStatus();
  const [eadl, setEadl] = useState(false);
  const { session } = useSelector((state) => state.get('authentication').toObject());
  const username = session?.username ?? ''

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

  useEffect(() => {
    // FETCH ISSUE CATEGORY
    if (eadl) {
      LocalGRMDatabase.find({
        selector: {
          type: 'issue',
          '$or': [
            {
              'reporter.name': eadl.representative.name,
            },
            {
              'assignee.name': eadl.representative.name
            }
          ]
        },
      })
        .then((result) => {
          setIssues(result?.docs);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [eadl]);

  if (!issues)
    return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" />;
  return (
    <SafeAreaView style={customStyles.container}>
      <Content issues={issues} eadl={eadl} statuses={issueStatusList} />
    </SafeAreaView>
  );
}

export default IssueSearch;

import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text } from 'react-native';
import { useSelector } from 'react-redux';
import Content from './containers/Content';
import { styles } from './IssueActions.styles';
import { LocalAdminLevelsDatabase } from '../../../db/databaseManager';
import { useIssueStatus } from '../../../hooks/issues/useIssueStatus';
import { useIssue } from '../../../hooks/issues/useIssue';

function IssueActions({ route, navigation }) {
  const { params } = route;
  const { issueStatusList, loading: statusListLoading } = useIssueStatus();
  const { updateIssue } = useIssue();
  const [loading, setLoading] = useState<boolean>(false);
  const [eadl, setEadl] = useState();
  const customStyles = styles();
  const { session } = useSelector((state) => state.get('authentication').toObject());
  const username = session?.username ?? '';

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
          console.log(err);
        });
    }
  }, [username]);

  useEffect(() => {
    console.log("### ISSUE STATUSES LIST", issueStatusList);
    
    if (statusListLoading) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [statusListLoading]);

  if (loading) {
    return (
      <SafeAreaView style={customStyles.container}>
        <Text>loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={customStyles.container}>
      <Content
        loading={loading}
        eadl={eadl}
        currentIssue={params.item}
        navigation={navigation}
        statuses={issueStatusList}
        updateIssue={updateIssue}
      />
    </SafeAreaView>
  );
}

export default IssueActions;

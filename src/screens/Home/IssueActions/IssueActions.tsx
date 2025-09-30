import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { useSelector } from 'react-redux';
import CustomLoadingSpinner from '../../../components/CustomLoadingSpinner/CustomLoadingSpinner';
import { LocalAdminLevelsDatabase } from '../../../db/databaseManager';
import { useIssue } from '../../../hooks/issues/useIssue';
import { useIssueStatus } from '../../../hooks/issues/useIssueStatus';
import Content from './containers/Content';
import { styles } from './IssueActions.styles';

function IssueActions({ route, navigation }) {
  const { params } = route;
  const { issueStatusList, loading: statusListLoading, getStatus } = useIssueStatus();
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
      <CustomLoadingSpinner />
    );
  }

  return (
    <SafeAreaView style={customStyles.container}>
      <Content
        loading={loading}
        eadl={eadl}
        session={session}
        currentIssue={params.item}
        navigation={navigation}
        statuses={issueStatusList}
        updateIssue={updateIssue}
        getStatus={getStatus}
      />
    </SafeAreaView>
  );
}

export default IssueActions;

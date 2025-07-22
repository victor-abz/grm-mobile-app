import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator } from 'react-native-paper';
import Content from './containers/Content';
import { styles } from './IssueHistory.styles';
import { LocalGRMDatabase } from '../../../utils/databaseManager';

function IssueHistory({ route }) {
  const customStyles = styles();
  const [issue, setIssue] = useState(route?.params?.item || null);
  const issueId = issue._id;
  const fetchIssue = async () => {
    try {
      const result = await LocalGRMDatabase.find({
        selector: { _id: issueId }
      });
      if (result.docs.length > 0) {
        setIssue(result.docs[0]);
      } else {
        console.log("issue not found");
      }
    } catch (err) {
      console.error("Error retrieving the issue:", err);
    }
  };

  // reload data on every display
  useFocusEffect(
    useCallback(() => {
      fetchIssue();
    }, [issueId])
  );

  if (!issue)
    return <ActivityIndicator style={{ paddingTop: '40%' }} size="small" color="#24c38b" />;

  return (
    <SafeAreaView style={customStyles.container}>
      <Content issue={issue} />
    </SafeAreaView>
  );
}

export default IssueHistory;

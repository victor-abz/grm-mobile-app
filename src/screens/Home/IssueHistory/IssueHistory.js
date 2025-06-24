import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import watermelonManager from '../../../database/watermelonManager';
import Content from './containers/Content';
import { styles } from './IssueHistory.styles';

const IssueHistory = ({ route, issue }) => {
  const { params } = route;
  const customStyles = styles();

  // Get the issue from route params or from the observable
  const issueData = Array.isArray(issue) && issue.length > 0 ? issue[0] : issue || params.item;

  console.log('🔍 [IssueHistory] Component received:', {
    issueId: params?.issueId || params?.item?.id,
    issueData: issueData ? 'Present' : 'Missing',
  });

  if (!issueData) {
    return (
      <SafeAreaView style={customStyles.container}>
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: 'gray' }}>Issue not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={customStyles.container}>
      <Content issue={issueData} />
    </SafeAreaView>
  );
};

// Enhanced withObservables to get specific issue
const enhance = withObservables(['route'], ({ route }) => {
  const issueId = route?.params?.issueId || route?.params?.item?.id;

  try {
    const observables = {};

    // If we have an issueId, observe the specific issue
    if (issueId) {
      observables.issue = watermelonManager
        .getDatabase()
        .get('grm_issues')
        .query(Q.where('id', issueId))
        .observe();
    }

    return observables;
  } catch (error) {
    console.error('Error setting up IssueHistory observables:', error);
    return {
      issue: { subscribe: () => ({ unsubscribe: () => {} }) },
    };
  }
});

export default enhance(IssueHistory);

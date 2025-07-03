import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import watermelonManager from '../../../database/watermelonManager';
import Content from './containers/Content';
import { styles } from './IssueHistory.styles';

const IssueHistory = ({ route, issue, comments, users }) => {
  const { params } = route;
  const customStyles = styles();

  // Get the issue from route params or from the observable
  const issueData = Array.isArray(issue) && issue.length > 0 ? issue[0] : issue || params.item;

  console.log('🔍 [IssueHistory] Component received:', {
    issueId: params?.issueId || params?.item?.id,
    issueData: issueData ? 'Present' : 'Missing',
    commentsCount: comments?.length || 0,
    usersCount: users?.length || 0,
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
      <Content issue={issueData} comments={comments} users={users} />
    </SafeAreaView>
  );
};

// Enhanced withObservables to get specific issue and its comments
const enhance = withObservables(['route'], ({ route }) => {
  const issueId = route?.params?.issueId || route?.params?.item?.id;

  try {
    const observables = {};

    // If we have an issueId, observe the specific issue and its comments
    if (issueId) {
      observables.issue = watermelonManager
        .getDatabase()
        .get('grm_issues')
        .query(Q.where('id', issueId))
        .observe();

      // ✅ NEW: Observe comments for this specific issue
      observables.comments = watermelonManager
        .getDatabase()
        .get('grm_issue_comments')
        .query(
          Q.where('grm_issue', issueId),
          Q.sortBy('created_at', Q.desc) // Sort by newest first
        )
        .observe();

      // ✅ NEW: Observe all users for name lookup
      observables.users = watermelonManager.getDatabase().get('users').query().observe();

      console.log('🔍 [IssueHistory] Setting up observables for issue:', issueId);
    }

    return observables;
  } catch (error) {
    console.error('Error setting up IssueHistory observables:', error);
    return {
      issue: { subscribe: () => ({ unsubscribe: () => {} }) },
      comments: { subscribe: () => ({ unsubscribe: () => {} }) },
      users: { subscribe: () => ({ unsubscribe: () => {} }) },
    };
  }
});

export default enhance(IssueHistory);

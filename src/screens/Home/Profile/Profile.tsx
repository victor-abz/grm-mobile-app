import React from 'react';
import {Text, Image, Animated, SafeAreaView, ScrollView, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useIssueStatus } from '../../../hooks/issues/useIssueStatus';
import Content from './containers';
import { styles } from './Profile.style';
import { useIssue } from '../../../hooks/issues/useIssue';
import { ActivityIndicator } from 'react-native-paper';
import { colors } from '../../../utils/colors';
import { i18n } from '../../../translations/i18n';

function Profile() {
  const { issueStatusList, loading: issueStatusesLoading } = useIssueStatus();
  const { profile, session } = useSelector((state) => state.get('authentication').toObject());
  const { assigneeIssueList, reporterIssueList, loading: issueListLoading } = useIssue(true);

  if (!assigneeIssueList || !reporterIssueList || issueListLoading || issueStatusesLoading)
    return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" />;
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>
          {i18n.t('profile')}
        </Text>
      </View>
      <ScrollView>
        <Content
          issues={[
            ...new Map(
              [...assigneeIssueList, ...reporterIssueList].map((issue) => [issue.id, issue])
            ).values(),
          ]}
          session={session}
          profile={profile}
          department={profile.department ?? {}}
          statuses={issueStatusList}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

export default Profile;


import React, { useEffect, useState, useContext } from 'react';
import { SafeAreaView, ScrollView, View, Text } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import watermelonManager from '../../../database/watermelonManager';
import { useData } from '../../../providers/DataProvider';
import { AuthContext } from '../../../providers/AuthProvider';
import { styles } from './IssueActions.styles';
import Content from './containers/Content';

const IssueActions = ({ route, navigation, issue, statuses = [] }) => {
  const { params } = route;
  const customStyles = styles();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [userContext, setUserContext] = useState(null);

  const { credentials } = useContext(AuthContext);
  const username = credentials?.username;
  const { isDataInitialized, dataManager } = useData();

  // Get the issue from route params or from the observable
  const issueData = Array.isArray(issue) && issue.length > 0 ? issue[0] : issue || params.item;

  console.log('🔍 [IssueActions] Component received:', {
    issueId: params?.issueId || params?.item?.id,
    issueData: issueData ? 'Present' : 'Missing',
    statusesCount: statuses?.length || 0,
  });

  useEffect(() => {
    const loadData = async () => {
      if (!isDataInitialized) return;

      try {
        setLoading(true);

        console.log('🔍 [IssueActions] Loading user context from DataManager...');

        // Get user context from DataManager (same pattern as IssueSearch)
        let context = null;
        if (dataManager) {
          context = dataManager.getUserContext();
          console.log('🔍 [IssueActions] User context from DataManager:', context);
        }

        // Fallback: Try to get user context directly from WatermelonDB
        if (!context) {
          console.warn('⚠️ [IssueActions] No DataManager context, trying WatermelonDB directly');
          try {
            const userContextData = await watermelonManager.getUserContext(username);
            if (userContextData) {
              context = {
                user: {
                  name: username,
                  email: username,
                  id: username,
                },
                ...userContextData,
              };
              console.log('🔍 [IssueActions] User context from WatermelonDB:', context);
            }
          } catch (wmError) {
            console.warn(
              '⚠️ [IssueActions] Could not load user context from WatermelonDB:',
              wmError
            );
          }
        }

        // Final fallback: create minimal user context
        if (!context) {
          context = {
            user: {
              name: username,
              email: username,
              id: username,
            },
            accessible_projects: [],
            accessible_regions: [],
            assignments: [],
            permissions: {},
          };
        }

        console.log('🔍 [IssueActions] Final user context:', context);
        setUserContext(context);
      } catch (error) {
        console.error('Error loading IssueActions data:', error);

        // Fallback to basic user context
        setUserContext({
          user: {
            name: username,
            email: username,
            id: username,
          },
          accessible_projects: [],
          accessible_regions: [],
          assignments: [],
          permissions: {},
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isDataInitialized, dataManager, username]);

  if (!isDataInitialized || loading || !userContext) {
    return (
      <SafeAreaView style={customStyles.container}>
        <ScrollView
          style={{
            backgroundColor: 'white',
            flex: 1,
          }}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View
            style={{
              zIndex: 20,
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator size="large" color="#24c38b" />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!issueData) {
    return (
      <SafeAreaView style={customStyles.container}>
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: 'gray' }}>{t('issue_not_found')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={customStyles.container}>
      <Content
        userContext={userContext}
        issue={issueData}
        navigation={navigation}
        statuses={statuses}
      />
    </SafeAreaView>
  );
};

// Enhanced withObservables to get specific issue and statuses
const enhance = withObservables(['route'], ({ route }) => {
  const issueId = route?.params?.issueId || route?.params?.item?.id;

  try {
    const observables = {
      // Get statuses for action buttons
      statuses: watermelonManager.getDatabase().get('grm_issue_statuses').query().observe(),
    };

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
    console.error('Error setting up IssueActions observables:', error);
    return {
      issue: { subscribe: () => ({ unsubscribe: () => {} }) },
      statuses: { subscribe: () => ({ unsubscribe: () => {} }) },
    };
  }
});

export default enhance(IssueActions);

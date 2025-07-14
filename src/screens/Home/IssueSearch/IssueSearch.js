import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { withObservables } from '@nozbe/watermelondb/react';
import { useData } from '../../../providers/DataProvider';
import watermelonManager from '../../../database/watermelonManager';
import { colors } from '../../../utils/colors';
import { styles } from './IssueSearch.style';
import Content from './containers';

const IssueSearch = ({
  issues = [],
  categories = [],
  types = [],
  statuses = [],
  ageGroups = [],
  citizenGroups = [],
  regions = [],
  projects = [],
  users = [],
}) => {
  console.log('🔍 [IssueSearch] Component props received:');
  console.log('  - Issues:', issues?.length || 0);
  console.log('  - Categories:', categories?.length || 0);
  console.log('  - Types:', types?.length || 0);
  console.log('  - Statuses:', statuses?.length || 0);
  console.log('  - Users:', users?.length || 0);
  console.log('  - Sample issue:', issues?.[0]);

  const customStyles = styles();
  const { username } = useSelector((state) => state.get('authentication').toObject());
  const { isDataInitialized, dataManager } = useData();

  const [userContext, setUserContext] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!isDataInitialized) return;

      try {
        setLoading(true);

        console.log('🔍 [IssueSearch] Loading user context from DataManager...');

        // Get user context from DataManager
        let context = null;
        if (dataManager) {
          context = dataManager.getUserContext();
          console.log('🔍 [IssueSearch] User context from DataManager:', context);
        }

        // Fallback: Try to get user context directly from WatermelonDB
        if (!context) {
          console.warn('⚠️ [IssueSearch] No DataManager context, trying WatermelonDB directly');
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
              console.log('🔍 [IssueSearch] User context from WatermelonDB:', context);
            }
          } catch (wmError) {
            console.warn(
              '⚠️ [IssueSearch] Could not load user context from WatermelonDB:',
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

        console.log('🔍 [IssueSearch] Final user context:', context);
        setUserContext(context);
      } catch (error) {
        console.error('Error loading initial data:', error);

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

    loadInitialData();
  }, [isDataInitialized, dataManager, username]);

  if (!isDataInitialized || loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" />;
  }

  return (
    <SafeAreaView style={customStyles.container}>
      <Content
        issues={issues}
        userContext={userContext}
        categories={categories}
        types={types}
        statuses={statuses}
        ageGroups={ageGroups}
        citizenGroups={citizenGroups}
        regions={regions}
        projects={projects}
        users={users}
      />
    </SafeAreaView>
  );
};

// Enhanced withObservables for direct WatermelonDB integration
// Provides all lookup data needed for issue display
const enhance = withObservables([], () => {
  try {
    return {
      // Primary data
      issues: watermelonManager.observeIssues({}),

      // Lookup data for label resolution - all reactive observables
      categories: watermelonManager.getDatabase().get('grm_issue_categories').query().observe(),
      types: watermelonManager.getDatabase().get('grm_issue_types').query().observe(),
      statuses: watermelonManager.getDatabase().get('grm_issue_statuses').query().observe(),
      ageGroups: watermelonManager.getDatabase().get('grm_issue_age_groups').query().observe(),
      citizenGroups: watermelonManager
        .getDatabase()
        .get('grm_issue_citizen_groups')
        .query()
        .observe(),
      regions: watermelonManager.getDatabase().get('grm_administrative_regions').query().observe(),
      projects: watermelonManager.getDatabase().get('grm_projects').query().observe(),
      users: watermelonManager.getDatabase().get('users').query().observe(),
    };
  } catch (error) {
    console.error('Error setting up WatermelonDB observables:', error);
    // Return empty observables as fallback
    return {
      issues: { subscribe: () => ({ unsubscribe: () => {} }) },
      categories: { subscribe: () => ({ unsubscribe: () => {} }) },
      types: { subscribe: () => ({ unsubscribe: () => {} }) },
      statuses: { subscribe: () => ({ unsubscribe: () => {} }) },
      ageGroups: { subscribe: () => ({ unsubscribe: () => {} }) },
      citizenGroups: { subscribe: () => ({ unsubscribe: () => {} }) },
      regions: { subscribe: () => ({ unsubscribe: () => {} }) },
      projects: { subscribe: () => ({ unsubscribe: () => {} }) },
      users: { subscribe: () => ({ unsubscribe: () => {} }) },
    };
  }
});

export default enhance(IssueSearch);

import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import withObservables from '@nozbe/with-observables';
import { useData } from '../../../providers/DataProvider';
import watermelonManager from '../../../database/watermelonManager';
import { colors } from '../../../utils/colors';
import { styles } from './IssueSearch.style';
import Content from './containers';

function IssueSearch({ issues = [], statuses = [] }) {
  const customStyles = styles();
  const { username } = useSelector((state) => state.get('authentication').toObject());
  const { isDataInitialized } = useData();

  const [eadl, setEadl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!isDataInitialized) return;

      try {
        setLoading(true);

        // Create user object based on username
        // This should be replaced with proper user data from Frappe when available
        setEadl({
          name: username,
          email: username,
          full_name: username,
        });
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [isDataInitialized, username]);

  if (!isDataInitialized || loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" />;
  }

  return (
    <SafeAreaView style={customStyles.container}>
      <Content issues={issues} eadl={eadl} statuses={statuses} />
    </SafeAreaView>
  );
}

// Enhanced component with reactive WatermelonDB queries
// Now uses proper observables for both issues and statuses
const enhance = withObservables([], () => {
  try {
    return {
      issues: watermelonManager.observeIssues({}), // Get all issues reactively with raw Frappe data
      statuses: watermelonManager.observeIssueStatuses(), // Get all statuses reactively with raw Frappe data
    };
  } catch (error) {
    console.error('Error setting up WatermelonDB observables:', error);
    // Return empty observables as fallback
    return {
      issues: { subscribe: () => ({ unsubscribe: () => {} }) },
      statuses: { subscribe: () => ({ unsubscribe: () => {} }) },
    };
  }
});

export default enhance(IssueSearch);

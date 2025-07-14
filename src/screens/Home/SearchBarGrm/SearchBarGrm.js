import React, { useState, useEffect, useContext } from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import withObservables from '@nozbe/with-observables';
import watermelonManager from '../../../database/watermelonManager';
import { DataContext } from '../../../providers/DataProvider';
import { colors } from '../../../utils/colors';
import { styles } from './SearchBarGrm.style';
import Content from './containers';

const SearchBarGrm = ({ issues = [] }) => {
  const { dataManager } = useContext(DataContext);
  const [loading, setLoading] = useState(true);
  const [eadl, setEadl] = useState(null);

  const { username } = useSelector((state) => state.get('authentication').toObject());

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Get representative data from DataManager
        // This replaces the PouchDB useView('eadl/by_representative_email')
        if (dataManager && username) {
          try {
            // For now, create a representative object from username
            // This should be enhanced to fetch actual representative data from Frappe
            const mockRepresentative = {
              _id: username,
              email: username,
              name: username,
              user_id: username,
            };
            setEadl([mockRepresentative]);
          } catch (error) {
            console.warn('Error loading representative data:', error);
            // Fallback to basic representative data
            const fallbackRepresentative = {
              _id: username,
              email: username,
              name: username,
            };
            setEadl([fallbackRepresentative]);
          }
        }
      } catch (error) {
        console.error('Error loading SearchBarGrm data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dataManager, username]);

  if (loading || !eadl) {
    return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Content issues={issues} eadl={eadl?.[0]} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Enhanced component with reactive WatermelonDB queries
const enhance = withObservables(['representative'], () => {
  try {
    return {
      issues: watermelonManager.observeIssues({}), // Get all issues reactively
      // Note: representative data is now handled in the component state
    };
  } catch (error) {
    console.error('Error setting up WatermelonDB observables for SearchBarGrm:', error);
    // Return empty observable as fallback
    return {
      issues: watermelonManager.database.collections.get('issues').query().observe(),
    };
  }
});

export default enhance(SearchBarGrm);

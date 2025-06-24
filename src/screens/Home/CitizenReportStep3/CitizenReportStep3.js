import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { withObservables } from '@nozbe/watermelondb/react';
import watermelonManager from '../../../database/watermelonManager';
import { styles } from './CitizenReportStep3.styles';
import Content from './containers/Content';
import dataManager from '../../../services/DataManager';

function CitizenReportStep3({ route, navigation, statuses = [] }) {
  const { params } = route;
  const customStyles = styles();
  const { username } = useSelector((state) => state.get('authentication').toObject());
  const [loading, setLoading] = useState(true);
  const [communesData, setCommunesData] = useState([]);

  console.log('🔍 [CitizenReportStep3] Component received statuses:', statuses?.length || 0);

  useEffect(() => {
    const loadCommunesData = async () => {
      try {
        setLoading(true);

        // TODO: Implement communes data loading with DataManager
        console.warn('CitizenReportStep3 - TODO: Implement communes data loading with DataManager');

        // Load administrative regions as substitute for communes
        const regions = await dataManager.getAdministrativeRegions();
        setCommunesData(regions);
      } catch (error) {
        console.error('Error loading CitizenReportStep3 data:', error);
        setCommunesData([]);
      } finally {
        setLoading(false);
      }
    };

    loadCommunesData();
  }, [username]);

  if (loading) {
    return (
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
    );
  }

  return (
    <SafeAreaView style={customStyles.container}>
      <Content
        stepOneParams={params?.stepOneParams || {}}
        stepTwoParams={params?.stepTwoParams || {}}
        stepLocationParams={params?.stepLocationParams || {}}
        statuses={statuses}
      />
    </SafeAreaView>
  );
}

// Enhanced withObservables to get statuses data
const enhance = withObservables([], () => {
  try {
    return {
      statuses: watermelonManager.getDatabase().get('grm_issue_statuses').query().observe(),
    };
  } catch (error) {
    console.error('Error setting up CitizenReportStep3 observables:', error);
    return {
      statuses: { subscribe: () => ({ unsubscribe: () => {} }) },
    };
  }
});

export default enhance(CitizenReportStep3);

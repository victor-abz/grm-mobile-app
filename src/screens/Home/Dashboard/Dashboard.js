import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native';
import * as Location from 'expo-location';
import Content from './containers';
import { logger } from '../../../utils/logger';
import { styles } from './Dashboard.style';

const Dashboard = () => {
  const customStyles = styles();

  useEffect(() => {
    logger.userAction('screen_load', 'Dashboard');

    (async () => {
      const { status } = await Location.requestPermissionsAsync();
      if (status !== 'granted') {
        logger.warn('Dashboard: Location permission denied');
      } else {
        logger.info('Dashboard: Location permission granted');
      }
    })();
  }, []);

  return (
    <SafeAreaView style={customStyles.container}>
      <Content />
    </SafeAreaView>
  );
};

export default Dashboard;

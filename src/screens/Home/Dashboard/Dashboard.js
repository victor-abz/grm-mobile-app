import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native';
import * as Location from 'expo-location';
import Content from './containers';
import { styles } from './Dashboard.style';

const Dashboard = () => {
  const customStyles = styles();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
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

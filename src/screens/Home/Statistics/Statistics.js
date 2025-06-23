import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import dataManager from '../../../services/DataManager';

function Statistics() {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);

  const { username } = useSelector((state) => state.get('authentication').toObject());

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        setLoading(true);

        // Get user context to find user ID
        const userContext = dataManager.getUserContext();
        const userId = userContext?.user_id || username;

        // Load statistics from DataManager
        const stats = await dataManager.getStatistics(userId);
        setStatistics(stats);
      } catch (error) {
        console.error('Error loading Statistics data:', error);
        // Set empty stats to prevent crashes
        setStatistics({
          total_issues: 0,
          open_issues: 0,
          resolved_issues: 0,
          pending_issues: 0,
          assigned_issues: 0,
          reported_issues: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, [username]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#24c38b" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {/* TODO: Implement Statistics UI */}
      <ActivityIndicator size="small" />
    </View>
  );
}

export default Statistics;

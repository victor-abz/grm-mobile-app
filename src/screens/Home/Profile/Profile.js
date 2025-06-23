import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import dataManager from '../../../services/DataManager';

function Profile() {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [issueData, setIssueData] = useState([]);
  const [userData, setUserData] = useState([]);

  const { username } = useSelector((state) => state.get('authentication').toObject());

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // TODO: Implement profile data loading with DataManager
        console.warn('Profile - TODO: Implement profile data loading with DataManager');

        // Load user's issues
        const userContext = dataManager.getUserContext();
        const userId = userContext?.user_id || username;

        const userIssues = await dataManager.getUserReportedIssues(userId);
        setIssueData(userIssues);

        // TODO: Implement communes/representative data loading
        console.warn('Profile - TODO: Implement communes/representative data loading');
        setUserData([]);

        // TODO: Implement full profile data
        console.warn('Profile - TODO: Implement full profile data');
        setProfileData({
          _id: 'placeholder',
          email: username,
          // TODO: Load actual profile data
        });
      } catch (error) {
        console.error('Error loading Profile data:', error);
        // Set empty data to prevent crashes
        setIssueData([]);
        setUserData([]);
        setProfileData({ _id: 'error', email: username });
      } finally {
        setLoading(false);
      }
    };

    loadData();
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
      {/* TODO: Implement Profile UI */}
      <ActivityIndicator size="small" />
    </View>
  );
}

export default Profile;

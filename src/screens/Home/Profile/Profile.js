import React, { useEffect, useState, useCallback, useContext } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { AuthContext } from '../../../providers/AuthProvider';
import dataManager from '../../../services/DataManager';
import { useFrappe } from '../../../providers/FrappeProvider';
import Content from './containers/Content';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [error, setError] = useState(null);

  const { credentials } = useContext(AuthContext);
  const username = credentials?.username;
  const { db, auth: _auth } = useFrappe();

  const checkNetworkStatus = useCallback(() => {
    const hasValidCredentials = !!(
      dataManager.credentials?.url && dataManager.credentials?.username
    );
    return dataManager.isOnline && hasValidCredentials;
  }, []);

  const loadData = useCallback(
    async (isRefresh = false) => {
      try {
        if (!isRefresh) {
          setLoading(true);
        }
        setError(null);

        const userContext = await dataManager.getUserContext();
        const isOnlineStatus = checkNetworkStatus();
        setIsOnline(isOnlineStatus);

        if (!userContext) {
          throw new Error('User context not found');
        }

        const userData = {
          _id: userContext.user?.id || username,
          email: userContext.user?.email || username,
          full_name: userContext.user?.full_name,
          phone: userContext.user?.phone,
          user_image: userContext.user?.user_image,
          assignments: userContext.assignments || [],
          permissions: userContext.permissions || {},
          accessible_regions: userContext.accessible_regions || [],
          last_sync: userContext.last_updated,
        };

        if (isOnlineStatus && db) {
          try {
            const frappeUser = await db.getDoc('User', username);
            if (frappeUser) {
              userData.full_name = frappeUser.full_name || userData.full_name;
              userData.phone = frappeUser.phone || userData.phone;
              userData.user_image = frappeUser.user_image || userData.user_image;
            }
          } catch (frappeError) {
            console.warn('Failed to fetch online user data:', frappeError);
            if (isRefresh) {
              throw new Error('Failed to refresh online data');
            }
          }
        }

        setProfileData(userData);
      } catch (loadError) {
        console.error('Error loading Profile data:', loadError);
        setError(loadError.message);
        if (!isRefresh) {
          setProfileData({
            _id: username,
            email: username,
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [username, db, checkNetworkStatus]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(checkNetworkStatus());
    };

    updateOnlineStatus();
    const checkInterval = setInterval(updateOnlineStatus, 1000);
    return () => clearInterval(checkInterval);
  }, [checkNetworkStatus]);

  const onRefresh = useCallback(async () => {
    if (!isOnline) return;
    setRefreshing(true);
    try {
      await loadData(true);
    } finally {
      setRefreshing(false);
    }
  }, [isOnline, loadData]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#24c38b" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} enabled={isOnline} />
      }
    >
      <Content profileData={profileData} isOnline={isOnline} error={error} />
    </ScrollView>
  );
};

export default Profile;

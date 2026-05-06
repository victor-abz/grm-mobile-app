import { DatabaseProvider } from '@nozbe/watermelondb/react';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import CustomLoadingSpinner from '../components/CustomLoadingSpinner/CustomLoadingSpinner';
import HomeRouter from '../screens/Home';
import { fetchFacilitatorProfile } from '../services/authService';
import { fetchAdministrativeRegions } from '../services/issues/AdministrativeRegionService';
import { syncServiceInstance } from '../services/shared/SyncService';
import { logout, setProfile } from '../store/ducks/authentication.duck';
import { setGlobalLoading } from '../store/ducks/global.duck';
import { i18n } from '../translations/i18n';
import { colors } from '../utils/colors';
import { INITIAL_DATA_FETCHED_STORAGE_KEY } from '../utils/constants';
import { databaseServiceInstance, getData, storeData } from '../utils/storageManager';

const { width } = Dimensions.get('screen');

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: '#dedede',
    text: '#707070',
  },
};

const Stack = createStackNavigator();
const PrivateRoutes = () => {
  const dispatch = useDispatch();
  const [dbReady, setDbReady] = React.useState(!!databaseServiceInstance.database);
  const [profileLoaded, setProfileLoaded] = React.useState(false);
  const [profileError, setProfileError] = React.useState<Error | null>(null);
  const { profile } = useSelector((state: any) => state.get('authentication').toObject());

  const fetchConstants = async () => {
    const hasInitialData = await getData(INITIAL_DATA_FETCHED_STORAGE_KEY);

    if (!hasInitialData) {
      try {
        dispatch(setGlobalLoading(true))
        const FETCH_ALL_PAGES = true;
        await fetchAdministrativeRegions(FETCH_ALL_PAGES);
        await storeData(INITIAL_DATA_FETCHED_STORAGE_KEY, true);
        dispatch(setGlobalLoading(false))
      } catch (error) {
        console.error(error);
        dispatch(setGlobalLoading(false))
      }
    }
  };

  const loadFacilitatorProfile = async () => {
    // Try to get facilitatorProfile from redux state first
    if (profile) {
      setProfileLoaded(true);
      return;
    }

    // Otherwise, fetch from API as before
    const facilitatorProfileResponse = await fetchFacilitatorProfile();
    if (facilitatorProfileResponse.error) {
      console.error(facilitatorProfileResponse.error);
      setProfileError(facilitatorProfileResponse.error);
    } else {
      dispatch(setProfile(facilitatorProfileResponse));
      setProfileLoaded(true);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      await loadFacilitatorProfile();
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (!profileLoaded) return;
    if (!databaseServiceInstance.database) {
      // Wait for the database to be initialized asynchronously
      const checkDb = setInterval(() => {
        if (databaseServiceInstance.database) {
          setDbReady(true);
          syncServiceInstance.syncAll();
          fetchConstants();
          clearInterval(checkDb);
        }
      }, 100);
      return () => clearInterval(checkDb);
    } else {
      setDbReady(true);
      syncServiceInstance.syncAll();
      fetchConstants();
    }
  }, [profileLoaded]);

  useEffect(() => {
    let syncAllInterval;

    // Guard: clear any existing interval before setting a new one
    if (dbReady) {
      const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
      // const SYNC_INTERVAL_MS = 1.5 * 60 * 1000; // 1.5 minutes
      // const SYNC_INTERVAL_MS = 7000;
      // const SYNC_INTERVAL_MS = 20000000000000; //
      syncAllInterval = setInterval(() => {
        syncServiceInstance.syncAll();
      }, SYNC_INTERVAL_MS);
    }

    return () => {
      if (syncAllInterval) {
        clearInterval(syncAllInterval);
      }
    };
  }, [dbReady]);

  if (profileError)
    return (
        <View style={{ flex: 1, justifyContent: 'space-between', alignItems: 'center' }}>
          <View/>
          <Text
            style={{
              fontSize: 20,
              textAlign: 'center',
              marginVertical: 16,
              marginHorizontal: 14,
              color: colors.primary,
              fontWeight: '600',
            }}
          >
            Something wrong has occurred. Please try again.
          </Text>
          <View>
            <Button
              theme={theme}
              style={[
                styles.reloadButton,
                {
                  backgroundColor: '#24c38b',
                },
              ]}
              color="white"
              onPress={() => {
                setProfileError(null);
                setProfileLoaded(false);
                loadFacilitatorProfile();
              }}
            >
              {i18n.t('reload')}
            </Button>
            <View style={{ marginVertical: 20 }} />
            <Button
              theme={theme}
              style={[
                styles.reloadButton,
                {
                  backgroundColor: colors.lightgray,
                },
              ]}
              color="white"
              onPress={() => dispatch(logout())}
            >
              {i18n.t('logout')}
            </Button>
            <View style={{ marginVertical: 20 }} />
            <Text
              style={{
                marginVertical: 16,
                color: colors.error,
                marginHorizontal: 14,
                textAlign: 'center',
              }}
            >
              {profileError.message}
              If the error persists, please contact support.
            </Text>
          </View>
        </View>
    );

  if (!dbReady) return <CustomLoadingSpinner />;

  return (
    <DatabaseProvider database={databaseServiceInstance.database}>
      <Stack.Navigator>
        {/* //* Home */}
        <Stack.Screen
          options={{
            headerShown: false,
          }}
          name="Main"
          component={HomeRouter}
        />
        {/* /* Along with these would come any other route that wouldn't fit inside
      the bottom tab navigator, meaning any view which doesn't display the tabs
      at the bottom of the screen. */}
      </Stack.Navigator>
    </DatabaseProvider>
  );
};

export default PrivateRoutes;

const styles = StyleSheet.create({
  reloadButton: {
    alignSelf: 'center',
    width: width - 60,
    height: 47,
    borderWidth: 1,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    backgroundColor: '#dedede',
  },
});

import { createStackNavigator } from '@react-navigation/stack';
import { databaseServiceInstance, getData, storeData } from '../utils/storageManager';
import React, { useEffect } from 'react';
import CustomLoadingSpinner from '../components/CustomLoadingSpinner/CustomLoadingSpinner';
import HomeRouter from '../screens/Home';
import { syncServiceInstance } from '../services/shared/SyncService';
import { fetchAdministrativeRegions } from '../services/issues/AdministrativeRegionService';
import { INITIAL_DATA_FETCHED_STORAGE_KEY } from '../utils/constants';
import { DatabaseProvider } from '@nozbe/watermelondb/react';
import { fetchFacilitatorProfile } from '../services/authService';
import { useDispatch, useSelector } from 'react-redux';
import { setProfile } from '../store/ducks/authentication.duck';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../utils/colors';
import { Button } from 'react-native-paper';
import { i18n } from '../translations/i18n';


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

//[x] install, auto create 3 instances, auto update 1 from remote.
//[x] manually update 1, check remote, check local.
//[x] (OFFLINE) manually update 1, check local, (CONNECT) check remote.
//[x] (OFFLINE) manually update 1, auto update remote(same), (CONNECT) check remote, check local. watermelon change wins against remote
//[x] check for empty pushChanges

const Stack = createStackNavigator();
const PrivateRoutes = () => {
  const dispatch = useDispatch();
  const [dbReady, setDbReady] = React.useState(!!databaseServiceInstance.database);
  const [profileLoaded, setProfileLoaded] = React.useState(false);
  const [profileError, setProfileError] = React.useState<Error | null>(null);
  const { profile } = useSelector((state: any) => state.get("authentication").toObject());
 
  const fetchConstants = async () => {
    const hasInitialData = await getData(INITIAL_DATA_FETCHED_STORAGE_KEY);
    //  await removeValue(INITIAL_DATA_FETCHED_STORAGE_KEY);
    if (!hasInitialData) {
      try {
        const FETCH_ALL_PAGES = true;
        await fetchAdministrativeRegions(FETCH_ALL_PAGES);
        await storeData(INITIAL_DATA_FETCHED_STORAGE_KEY, true);
      } catch (error) {
        console.error(error);
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        
        <Text style={{ marginVertical: 16, color: "red" }}>
          Something wrong has occurred. Please try again.
        </Text>
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
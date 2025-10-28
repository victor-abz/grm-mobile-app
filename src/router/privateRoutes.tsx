import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import CustomLoadingSpinner from '../components/CustomLoadingSpinner/CustomLoadingSpinner';
import HomeRouter from '../screens/Home';
import { syncServiceInstance } from '../services/shared/SyncService';
import { fetchAdministrativeRegions } from '../services/issues/AdministrativeRegionService';
import { INITIAL_DATA_FETCHED_STORAGE_KEY } from '../utils/constants';
import { getData, storeData } from '../utils/storageManager';
import { DatabaseProvider } from '@nozbe/watermelondb/react';

//[x] install, auto create 3 instances, auto update 1 from remote.
//[x] manually update 1, check remote, check local. 
//[x] (OFFLINE) manually update 1, check local, (CONNECT) check remote.
//[x] (OFFLINE) manually update 1, auto update remote(same), (CONNECT) check remote, check local. watermelon change wins against remote
//[x] check for empty pushChanges

const Stack = createStackNavigator();
const PrivateRoutes = () =>
{
  const [dbReady, setDbReady] = React.useState(!!syncServiceInstance.database);
  const [loading, setLoading] = React.useState(true);

   const fetchConstants = async () =>  {
     const hasInitialData = await getData(INITIAL_DATA_FETCHED_STORAGE_KEY);
     console.log("initial data", hasInitialData);
    //  await removeValue(INITIAL_DATA_FETCHED_STORAGE_KEY);
     if (!hasInitialData) {
        try {
          await fetchAdministrativeRegions(true);
          await storeData(INITIAL_DATA_FETCHED_STORAGE_KEY, true);
        } catch (error) {
          console.error(error);
        }
      }
    }

  useEffect(() => {
    if (!syncServiceInstance.database) {
    
      // Wait for the database to be initialized asynchronously
      const checkDb = setInterval(() => {
    

        if (syncServiceInstance.database) {
          setDbReady(true);
          syncServiceInstance.syncAll();
          fetchConstants();
          clearInterval(checkDb);
        }
      }, 100);
      return () => clearInterval(checkDb);
    }
  }, []);

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

  if (!dbReady) return <CustomLoadingSpinner />;
  
  return (
    <DatabaseProvider database={syncServiceInstance.database}>
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

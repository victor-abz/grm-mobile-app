import { DatabaseProvider } from '@nozbe/watermelondb/react';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import CustomLoadingSpinner from '../components/CustomLoadingSpinner/CustomLoadingSpinner';
import HomeRouter from '../screens/Home/';
import { syncServiceInstance } from '../services/shared/SyncService';

const Stack = createStackNavigator();
const PrivateRoutes = () => {
  const [dbReady, setDbReady] = React.useState(!!syncServiceInstance.database);

  useEffect(() => {
    if (!syncServiceInstance.database) {
      // Wait for the database to be initialized asynchronously
      const checkDb = setInterval(() => {
        if (syncServiceInstance.database) {
          setDbReady(true);
          syncServiceInstance.syncAll();
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

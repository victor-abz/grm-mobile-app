import React from 'react';
import { Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeRouter from '../screens/Home/';
import { syncServiceInstance } from '../services/shared/SyncService';
import { DatabaseProvider } from '@nozbe/watermelondb/react';

const Stack = createStackNavigator();
const PrivateRoutes = () =>
{
  const [dbReady, setDbReady] = React.useState(!!syncServiceInstance.database);

  React.useEffect(() => {
    if (!syncServiceInstance.database) {
      // Wait for the database to be initialized asynchronously
      const checkDb = setInterval(() => {
        if (syncServiceInstance.database) {
          setDbReady(true);
          clearInterval(checkDb);
        }
      }, 100);
      return () => clearInterval(checkDb);
    }
  }, []);

  if (!dbReady) return <><Text>Loading database...</Text></>;
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

import { useEffect, useState, useRef } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import PrivateRoutes from "./privateRoutes";
import PublicRoutes from "./publicRoutes";
import { useDispatch, useSelector } from "react-redux";
import { AppState, View } from "react-native";
import { init, getSessionData } from "../store/ducks/authentication.duck";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_700Bold,
  Poppins_400Regular_Italic,
  useFonts,
} from "@expo-google-fonts/poppins";
import { syncServiceInstance } from "../services/shared/SyncService";
import { setupConnectionWatcher } from "../utils/networkMonitor";
import { issueStatusSyncables } from "../services/shared/IssueStatusService";

const Router = ({ theme }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  const appState = useRef(AppState.currentState);

  const { session } = useSelector((state) => {
    return state.get("authentication").toObject();
  });

  const getDBConfig = async () =>
  {
    const _session = await getSessionData(); 
    if (_session) {
      dispatch(init(_session));
    }
    setLoading(false);
  };

  useEffect(() =>
  {
    if (!loading) { 
      // TODO: enable syncables when authenticated
      // TODO: register and deregister syncables when going background, or maybe listen if they exist to avoid creating many
      prepareSyncables();
    }
  }, [loading])

  useEffect(() => {
    getDBConfig();
    const handleAppStateChange = (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground, resume syncs
        try {
          getDBConfig();              
          console.log('Resumed all syncs after foreground');
          
        } catch (err) {
          console.warn('Error resuming syncs:', err);
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      syncServiceInstance.removeAll()
    };
  
  }, []);

  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
    Poppins_400Regular_Italic,
  });

  if (loading || !fontsLoaded) return <View />;

  return (
    <NavigationContainer theme={theme || DefaultTheme}>
      { session ? <PrivateRoutes /> : <PublicRoutes /> }
    </NavigationContainer>
  );
};

function prepareSyncables()
{
  const combinedSyncables = [...issueStatusSyncables]
  
  combinedSyncables.forEach(element => {
    syncServiceInstance.register(element)
  });

  setupConnectionWatcher();
}

export default Router;

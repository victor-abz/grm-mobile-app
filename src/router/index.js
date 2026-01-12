import { useEffect, useState, useRef } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import PrivateRoutes from "./privateRoutes";
import PublicRoutes from "./publicRoutes";
import { useDispatch, useSelector } from "react-redux";
import { AppState, View } from "react-native";
import { init, getSessionData, getProfileData } from "../store/ducks/authentication.duck";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_700Bold,
  Poppins_400Regular_Italic,
  useFonts,
} from "@expo-google-fonts/poppins";
import { syncServiceInstance } from "../services/shared/SyncService";
import { initialSync } from "../utils/networkMonitor";
import { databaseServiceInstance } from "../utils/storageManager";

const Router = ({ theme }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  const appState = useRef(AppState.currentState);

  const { session } = useSelector((state) => {
    return state.get("authentication").toObject();
  });

  const getSession = async () =>
  {
    
    const _session = await getSessionData();
    const profile = await getProfileData();

    if (_session) {
      dispatch(init(
        _session,
        profile,
      ));
    }
    setLoading(false);
  };

  useEffect(() =>
  {

      const checkSessionAndSync = async () => {
        if (!databaseServiceInstance.database && session?.token) {
          await initialSync();
          setLoading(false);
        } else {
          setLoading(false);
        }
      };
      checkSessionAndSync();
    
  }, [session])
  
  useEffect(() => {
    getSession();
    const handleAppStateChange = (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground, resume syncs
        try {
          getSession();
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

export default Router;

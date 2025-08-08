import { useEffect, useState, useRef } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import PrivateRoutes from "./privateRoutes";
import PublicRoutes from "./publicRoutes";
import { useDispatch, useSelector } from "react-redux";
import { AppState, View } from "react-native";
import { getEncryptedData } from "../utils/storageManager";
import { init } from "../store/ducks/authentication.duck";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_700Bold,
  Poppins_400Regular_Italic,
  useFonts,
} from "@expo-google-fonts/poppins";

const Router = ({ theme }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  const appState = useRef(AppState.currentState);

  const { userPassword } = useSelector((state) => {
    return state.get("authentication").toObject();
  });

  const getDBConfig = async () =>
  {
    //TODO: use new token based authentication
    const password = await getEncryptedData(process.env.DB_USER_PW_KEY);
    let dbCredentials;
    let username;
    if (password) {
      username = await getEncryptedData(process.env.DB_USER_KEY);
      dbCredentials = await getEncryptedData(
        `dbCredentials_${password}_${username.replace("@", "")}`
      );
      dispatch(init(dbCredentials, { password, email: username }));
    }
    setLoading(false);
  };

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
      {userPassword ? <PrivateRoutes /> : <PublicRoutes />}
    </NavigationContainer>
  );
};

export default Router;

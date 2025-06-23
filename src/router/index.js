import {
  Poppins_200ExtraLight,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_400Regular_Italic,
  Poppins_500Medium,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useState, useContext } from 'react';
import { View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { init } from '../store/ducks/authentication.duck';
import { getEncryptedData } from '../utils/storageManager';
import { AuthContext } from '../providers/AuthProvider';
import PrivateRoutes from './privateRoutes';
import PublicRoutes from './publicRoutes';

function Router({ theme }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, isLoading: authLoading } = useContext(AuthContext);

  const { userPassword } = useSelector((state) => state.get('authentication').toObject());

  const getDBConfig = async () => {
    const password = await getEncryptedData('userPassword');
    let dbCredentials;
    let username;
    if (password) {
      username = await getEncryptedData(`username`);
      dbCredentials = await getEncryptedData(
        `dbCredentials_${password}_${username.replace('@', '')}`
      );
      dispatch(init(dbCredentials, { password, email: username }));
    }
    setLoading(false);
  };

  useEffect(() => {
    getDBConfig();
  }, []);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
    Poppins_400Regular_Italic,
    Poppins_300Light,
    Poppins_200ExtraLight,
  });

  // Show loading while authentication state is being determined
  if (loading || !fontsLoaded || authLoading) {
    console.log(
      '🔄 Router: Loading state - loading:',
      loading,
      'fontsLoaded:',
      fontsLoaded,
      'authLoading:',
      authLoading
    );
    return <View />;
  }

  // Log authentication state for debugging
  const hasAuth = userPassword || isAuthenticated;
  console.log(
    '🔄 Router: Authentication check - userPassword:',
    !!userPassword,
    'isAuthenticated:',
    isAuthenticated,
    'hasAuth:',
    hasAuth
  );

  return (
    <NavigationContainer theme={theme || DefaultTheme}>
      {hasAuth ? <PrivateRoutes /> : <PublicRoutes />}
    </NavigationContainer>
  );
}

export default Router;

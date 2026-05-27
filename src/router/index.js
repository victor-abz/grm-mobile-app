import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import React, { useContext } from 'react';
import { View, Text, Image } from 'react-native';
import { AuthContext } from '../providers/AuthProvider';
import PrivateRoutes from './privateRoutes';
import PublicRoutes from './publicRoutes';

// Import assets at the top to avoid global-require
const logoSource = require('../../assets/egrm-logo.png');

const Router = ({ theme: _theme }) => {
  const { isAuthenticated, isLoading: authLoading } = useContext(AuthContext);

  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Show loading while authentication state is being determined or fonts are loading
  if ((!fontsLoaded && !fontError) || authLoading) {
    console.log(
      '🔄 Router: Loading state - fontsLoaded:',
      fontsLoaded,
      'fontError:',
      fontError,
      'authLoading:',
      authLoading
    );
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Image
          source={logoSource}
          style={{ width: 180, height: 180, marginBottom: 24, resizeMode: 'contain' }}
        />
        <Text>Loading...</Text>
      </View>
    );
  }

  // If there's a font error, log it but continue with system fonts
  if (fontError) {
    console.warn('❌ Font loading error:', fontError);
  }

  console.log('✅ Router: Ready - isAuthenticated:', isAuthenticated, 'fontsLoaded:', fontsLoaded);

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#ffffff',
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      {isAuthenticated ? <PrivateRoutes /> : <PublicRoutes />}
    </NavigationContainer>
  );
};

export default Router;

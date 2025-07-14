// Polyfill for Hermes async/await support
import 'regenerator-runtime/runtime';

// Add polyfills for React Native JavaScript engine
import 'intl';
import 'intl/locale-data/jsonp/en';

/* eslint-disable react/no-unknown-property */
import React, { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as PaperProvider } from 'react-native-paper';
import store from './src/store';
import { AuthProvider } from './src/providers/AuthProvider';
import { FrappeProvider } from './src/providers/FrappeProvider';
import { DataProvider } from './src/providers/DataProvider';
import Router from './src/router';
import { paperTheme } from './src/theme';
import './src/translations/i18n';

if (__DEV__) {
  // eslint-disable-next-line no-console
  import('./ReactotronConfig').then(() => console.log('Reactotron Configured'));
}

// Keep splash screen visible while initializing
SplashScreen.preventAutoHideAsync();

const App = () => {
  useEffect(() => {
    console.log('🚀 GRM App initializing...');

    // Initialize the app
    const initializeApp = async () => {
      try {
        // DataManager will be initialized by DataProvider
        console.log('✅ App initialization completed');
        await SplashScreen.hideAsync();
      } catch (error) {
        console.error('❌ App initialization failed:', error);
        await SplashScreen.hideAsync();
      }
    };

    initializeApp();
  }, []);

  return (
    <ReduxProvider store={store}>
      <AuthProvider>
        <FrappeProvider>
          <DataProvider>
            <PaperProvider theme={paperTheme}>
              <Router />
            </PaperProvider>
          </DataProvider>
        </FrappeProvider>
      </AuthProvider>
    </ReduxProvider>
  );
};

export default App;

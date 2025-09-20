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
import * as Sentry from '@sentry/react-native';
import store from './src/store';
import { AuthProvider } from './src/providers/AuthProvider';
import { FrappeProvider } from './src/providers/FrappeProvider';
import { DataProvider } from './src/providers/DataProvider';
import Router from './src/router';
import { paperTheme } from './src/theme';
import './src/translations/i18n';

Sentry.init({
  dsn: 'https://7ce3082873304223b3c299c683e037af@bugsink.victor-abz.com/1',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

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

export default Sentry.wrap(App);

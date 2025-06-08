// Add polyfills for React Native JavaScript engine
import 'intl';
import 'intl/locale-data/jsonp/en.js';

/* eslint-disable react/no-unknown-property */
import React, { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as PouchProvider } from 'use-pouchdb';
import Router from './src/router';
import { AuthProvider } from './src/providers/AuthProvider';
import { FrappeProvider } from './src/providers/FrappeProvider';
import { DataProvider } from './src/providers/DataProvider';
import AppDiagnostic from './src/components/AppDiagnostic';
import store from './src/store';
import './src/translations/i18n';
import LocalDatabase, {
  LocalCommunesDatabase,
  LocalGRMDatabase,
} from './src/utils/databaseManager';

if (__DEV__) {
  // eslint-disable-next-line no-console
  import('./ReactotronConfig').then(() => console.log('Reactotron Configured'));
}

function App() {
  useEffect(() => {
    // Initialize PouchDB databases only
    const initializeDatabases = async () => {
      try {
        console.log('Initializing local databases...');
        // PouchDB databases are already initialized by imports
        console.log('Local databases ready');
      } catch (error) {
        console.error('Error initializing databases:', error);
        // App can still function, just log the error
      }
    };

    initializeDatabases();
  }, []);

  // Temporarily use diagnostic component for testing
  if (__DEV__) {
    console.log('App is starting in development mode...');

    // For debugging - render simple component first
    // return <AppDiagnostic />;
  }

  return (
    <ReduxProvider store={store}>
      <AuthProvider>
        <FrappeProvider>
          <DataProvider>
            <PouchProvider
              default="localGRMDatabase"
              databases={{
                LocalGRMDatabase,
                LocalDatabase,
                LocalCommunesDatabase,
              }}
            >
              <PaperProvider>
                <Router />
              </PaperProvider>
            </PouchProvider>
          </DataProvider>
        </FrappeProvider>
      </AuthProvider>
    </ReduxProvider>
  );
}

export default App;

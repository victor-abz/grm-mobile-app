/* eslint-disable react/no-unknown-property */
import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as PouchProvider } from 'use-pouchdb';
import Router from './src/router';
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
  return (
    <ReduxProvider store={store}>
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
    </ReduxProvider>
  );
}

export default App;

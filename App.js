/* eslint-disable react/no-unknown-property */
import React, { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as PouchProvider } from 'use-pouchdb';
import Router from './src/router';
import store from './src/store';
import './src/translations/i18n';
import LocalDatabase, {
  LocalCommunesDatabase,
  LocalGRMDatabase,
  SyncToRemoteDatabase,
} from './src/utils/databaseManager';

if (__DEV__) {
  // eslint-disable-next-line no-console
  import('./ReactotronConfig').then(() => console.log('Reactotron Configured'));
}

function App() {
  useEffect(() => {
    SyncToRemoteDatabase({ username: 'admin', password: 'admin' }, 'test@rbc.gov.rw');
  });
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

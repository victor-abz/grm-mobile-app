import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from "react-redux";
import { initDB } from "./src/repositories/local/BaseLocalRepository";
import Router from "./src/router/";
import store from "./src/store";
import "./src/translations/i18n";

if (__DEV__) {
  // eslint-disable-next-line no-console
  import("./ReactotronConfig").then(() => console.log("Reactotron Configured"));
}

const App = () =>
{
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await initDB();
        setDbReady(true);
      } catch (e) {
        console.error('DB init error', e);
      }
    }
    prepare();
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Initializing database...</Text>
      </View>
    );
  }

  return (
      <ReduxProvider store={store}>
          <PaperProvider>
            <Router />
          </PaperProvider>
      </ReduxProvider>
  );
};

export default App;

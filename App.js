import React from "react";
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from "react-redux";
import store from "./src/store";
import "./src/translations/i18n";
import Router from "./src/router";

if (__DEV__) {
  // eslint-disable-next-line no-console
  import("./ReactotronConfig").then(() => console.log("Reactotron Configured"));
}

const App = () =>
{
  return (
      <ReduxProvider store={store}>
          <PaperProvider>
            <Router />
          </PaperProvider>
      </ReduxProvider>
  );
};

export default App;
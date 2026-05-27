import { createStore, compose } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import reducers from './ducks';

let middleWare;

// eslint-disable-next-line no-undef
if (__DEV__) {
  const Reactotron = require('../../ReactotronConfig').default; // eslint-disable-line global-require
  middleWare = composeWithDevTools(Reactotron.createEnhancer());
} else {
  middleWare = compose();
}

const store = createStore(reducers, middleWare);

export default store;

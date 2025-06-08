import { Map } from 'immutable';
import { createActions, handleActions } from 'redux-actions';
import { setDataManagerCredentials } from '../../utils/databaseManager';
import {
  clearEncryptedValues,
  getEncryptedData,
  removeEncryptedValue,
  storeEncryptedData,
} from '../../utils/storageManager';

const defaultState = Map({
  userPassword: null,
  username: null,
});

function getRemoteDbConfig() {
  const credentials = getEncryptedData('dbCredentials');
  return credentials;
}

export const { init, login, signUp, logout } = createActions({
  INIT: async (dbCredentials, credentials) => {
    try {
      // Set credentials for the new data manager
      const authCredentials = {
        username: credentials.email,
        password: credentials.password,
      };
      await setDataManagerCredentials(authCredentials);

      return { password: credentials.password, username: credentials.email };
    } catch (error) {
      console.error('Error initializing with new data manager:', error);
      throw error;
    }
  },
  LOGIN: async (dbCredentials, credentials) => {
    try {
      storeEncryptedData(
        `dbCredentials_${credentials.password}_${credentials.email.replace('@', '')}`,
        dbCredentials
      );
      storeEncryptedData(`userPassword`, credentials.password);
      storeEncryptedData(`username`, credentials.email);

      // Set credentials for the new data manager
      const authCredentials = {
        username: credentials.email,
        password: credentials.password,
      };
      await setDataManagerCredentials(authCredentials);

      return { password: credentials.password, username: credentials.email };
    } catch (error) {
      console.error('Error logging in with new data manager:', error);
      throw error;
    }
  },
  SIGN_UP: async (dbCredentials, credentials) => {
    try {
      storeEncryptedData(
        `dbCredentials_${credentials.password}_${credentials.email.replace('@', '')}`,
        dbCredentials
      );
      storeEncryptedData(`userPassword`, credentials.password);
      storeEncryptedData(`username`, credentials.email);

      // Set credentials for the new data manager
      const authCredentials = {
        username: credentials.email,
        password: credentials.password,
      };
      await setDataManagerCredentials(authCredentials);

      return { password: credentials.password, username: credentials.email };
    } catch (error) {
      console.error('Error signing up with new data manager:', error);
      throw error;
    }
  },
  LOGOUT: () => {
    clearEncryptedValues();
    return { password: null, username: null };
  },
});

const authentication = handleActions(
  {
    [init]: (draft, { payload: { password, username } }) => {
      return draft.withMutations((state) => {
        state.set('userPassword', password);
        state.set('username', username);
      });
    },
    [login]: (draft, { payload: { password, username } }) => {
      return draft.withMutations((state) => {
        state.set('userPassword', password);
        state.set('username', username);
      });
    },
    [signUp]: (draft, { payload: { password, username } }) => {
      return draft.withMutations((state) => {
        state.set('userPassword', password);
        state.set('username', username);
      });
    },
    [logout]: (draft, { payload: { password, username } }) => {
      return draft.withMutations((state) => {
        state.set('userPassword', password);
        state.set('username', username);
      });
    },
  },
  defaultState
);

export default authentication;

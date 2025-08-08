import { Map } from "immutable";
import { createActions, handleActions } from "redux-actions";
import { logoutRemoteDBs, SyncToRemoteDatabase } from "../../db/databaseManager";
import {
  getEncryptedData,
  removeEncryptedValue,
  storeEncryptedData,
} from "../../utils/storageManager";

const defaultState = Map({
  userPassword: null,
  username: null,
  session: null
});

function getRemoteDbConfig() {

  const credentials = getEncryptedData("dbCredentials");
  return credentials;
}

export const { init, login, signUp, logout } = createActions({
  INIT: (dbCredentials, credentials) => {
    SyncToRemoteDatabase(dbCredentials, credentials.email);
    return { password: credentials.password, username: credentials.email };
  },
  LOGIN: (dbCredentials, credentials) => {
    storeEncryptedData(
      `dbCredentials_${credentials.password}_${credentials.email.replace(
        "@",
        ""
      )}`,
      dbCredentials
    );
    storeEncryptedData(process.env.DB_USER_PW_KEY, credentials.password);
    storeEncryptedData(process.env.DB_USER_KEY, credentials.email);
    SyncToRemoteDatabase(dbCredentials, credentials.email);
    return { password: credentials.password, username: credentials.email };
  },
  SIGN_UP: (dbCredentials, credentials) => {
    storeEncryptedData(
      `dbCredentials_${credentials.password}_${credentials.email.replace(
        "@",
        ""
      )}`,
      dbCredentials
    );
    storeEncryptedData(process.env.DB_USER_PW_KEY, credentials.password);
    storeEncryptedData(process.env.DB_USER_KEY, credentials.email);
    SyncToRemoteDatabase(dbCredentials, credentials.email);
    return { password: credentials.password, username: credentials.email };
  },
  LOGOUT: () => {
    removeEncryptedValue(process.env.DB_USER_PW_KEY);
    removeEncryptedValue(process.env.DB_USER_KEY);
    logoutRemoteDBs();
    return { password: null, username: null };
  },
});

const authentication = handleActions(
  {
    [init]: (draft, { payload: { password, username } }) => {
      return draft.withMutations((state) => {
        state.set("userPassword", password);
        state.set("username", username);
      });
    },
    [login]: (draft, { payload: { password, username } }) => {
      return draft.withMutations((state) => {
        state.set("userPassword", password);
        state.set("username", username);
      });
    },
    [signUp]: (draft, { payload: { password, username } }) => {
      return draft.withMutations((state) => {
        state.set("userPassword", password);
        state.set("username", username);
      });
    },
    [logout]: (draft, { payload: { password, username } }) => {
      return draft.withMutations((state) => {
        state.set("userPassword", password);
        state.set("username", username);
      });
    },
  },
  defaultState
);

export default authentication;

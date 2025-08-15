import { Map } from "immutable";
import { createActions, handleActions } from "redux-actions";
import { logoutRemoteDBs, SyncToRemoteDatabase } from "../../utils/databaseManager";
import {
  getEncryptedData,
  removeEncryptedValue,
  storeEncryptedData,
} from "../../utils/storageManager";
import request, { client } from "../../utils/request";

const defaultState = Map({
  userPassword: null,
  username: null,
});

function getRemoteDbConfig() {

  const credentials = getEncryptedData("dbCredentials");
  return credentials;
}

function setUpAuthClient(params) {
  client.defaults.headers.common["Authorization"] = `Bearer ${"uyoipuoiuopiu"}`
}

function removeAuthHeader(params) {
  delete client.defaults.headers.common.Authorization;
}

export const { init, login, signUp, logout } = createActions({
  INIT: (dbCredentials, credentials) => {
    setUpAuthClient()
    SyncToRemoteDatabase(dbCredentials, credentials.email);
    return { password: credentials.password, username: credentials.email };
  },
  LOGIN: (dbCredentials, credentials) => {
    setUpAuthClient()
    storeEncryptedData(
      `dbCredentials_${credentials.password}_${credentials.email.replace(
        "@",
        ""
      )}`,
      dbCredentials
    );
    storeEncryptedData(`userPassword`, credentials.password);
    storeEncryptedData(`username`, credentials.email);
    SyncToRemoteDatabase(dbCredentials, credentials.email);
    return { password: credentials.password, username: credentials.email };
  },
  SIGN_UP: (dbCredentials, credentials) => {
    setUpAuthClient()
    storeEncryptedData(
      `dbCredentials_${credentials.password}_${credentials.email.replace(
        "@",
        ""
      )}`,
      dbCredentials
    );
    storeEncryptedData(`userPassword`, credentials.password);
    storeEncryptedData(`username`, credentials.email);
    SyncToRemoteDatabase(dbCredentials, credentials.email);
    return { password: credentials.password, username: credentials.email };
  },
  LOGOUT: () => {
    removeAuthHeader();
    removeEncryptedValue("userPassword");
    removeEncryptedValue("username");
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

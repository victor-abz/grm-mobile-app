import { Map } from "immutable";
import { createActions, handleActions } from "redux-actions";
import { logoutRemoteDBs, SyncToRemoteDatabase } from "../../db/databaseManager";
import {
  getEncryptedData,
  removeEncryptedValue,
  storeEncryptedData,
} from "../../utils/storageManager";
import config from "../../../config";

const defaultState = Map({
  session: null,
  profile: null,
});

function storeSessionData(sessionObject) {
  storeEncryptedData(config.USER_SESSION_KEY, JSON.stringify(sessionObject));
}

function removeSessionData() {
  removeEncryptedValue(config.USER_SESSION_KEY);
}

export async function getSessionData() {
  const sessionData = await getEncryptedData(config.USER_SESSION_KEY);
  return sessionData ? JSON.parse(sessionData) : null;
}

export const { init, login, signUp, logout } = createActions({
  INIT: (session) =>
  {
    // SyncToRemoteDatabase(session);
    return { session };
  },
  LOGIN: (sessionObject, credentials) =>
  {
    storeSessionData(sessionObject);
    // SyncToRemoteDatabase(dbCredentials, credentials.email);
    return { session: sessionObject, password: credentials.password, username: credentials.email };
  },
  SIGN_UP: (sessionObject, credentials) => {
    storeSessionData(sessionObject);
    // SyncToRemoteDatabase(dbCredentials, credentials.email);
    return { password: credentials.password, username: credentials.email };
  },
  LOGOUT: () => {
    removeSessionData();
    logoutRemoteDBs();
    return { password: null, username: null };
  },
});

const authentication = handleActions(
  {
    [init]: (draft, { payload: { session } }) => {
      return draft.withMutations((state) => {
        state.set("session", session);
      });
    },
    [login]: (draft, { payload: { session } }) => {
      return draft.withMutations((state) => {        
        state.set("session", session);
      });
    },
    [signUp]: (draft, { payload: { session } }) => {
      return draft.withMutations((state) => {
        state.set("session", session);
      });
    },
    [logout]: (draft, { payload: { session } }) => {
      return draft.withMutations((state) => {
        state.set("session", session);
      });
    },
  },
  defaultState
);

export default authentication;

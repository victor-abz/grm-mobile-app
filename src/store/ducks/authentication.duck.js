import { Map } from "immutable";
import { createActions, handleActions } from "redux-actions";
import { logoutRemoteDBs, SyncToRemoteDatabase } from "../../db/databaseManager";
import {
  removeEncryptedValue,
  storeEncryptedData,
  getEncryptedData
} from "../../utils/storageManager";
import { client } from "../../utils/request";
import config from "../../../config";

const defaultState = Map({
  session: null,
  profile: null,
});

function storeSessionData(sessionObject) {
  client.defaults.headers.common["Authorization"] = `Bearer ${sessionObject.token}`
  storeEncryptedData(config.USER_SESSION_KEY, JSON.stringify(sessionObject));
}

function removeSessionData()
{
  delete client.defaults.headers.common.Authorization;
  removeEncryptedValue(config.USER_SESSION_KEY);
}

export async function getSessionData() {
  const sessionData = await getEncryptedData(config.USER_SESSION_KEY);
  return sessionData ? JSON.parse(sessionData) : null;
}

export const { init, login, signUp, logout } = createActions({
  INIT: (session) =>
  {
    return { session };
  },
  LOGIN: (session, credentials) =>
  {
    storeSessionData(session);
    return { session };
  },
  SIGN_UP: (session, credentials) => {
    storeSessionData(session);
    return { session };
  },
  LOGOUT: () => {
    removeSessionData();
    logoutRemoteDBs();
    return { session: null, profile: null };
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

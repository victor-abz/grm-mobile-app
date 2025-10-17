import { Map } from "immutable";
import { createActions, handleActions } from "redux-actions";
import { logoutRemoteDBs, SyncToRemoteDatabase } from "../../db/databaseManager"; //TODO: Delete after migrating to the new services, used for debugging purposes with old data.
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
  userPassword: null, username: null, //TODO: Delete after migrating to the new services, used for debugging purposes with old data.
});

function storeSessionData(sessionObject) {
  storeEncryptedData(config.USER_SESSION_KEY, JSON.stringify(sessionObject));
}

function addTokenToHttpClient(sessionObject) {
  client.defaults.headers.common["Authorization"] = `Token ${sessionObject.token}`;
}

function removeSessionData() {
  delete client.defaults.headers.common.Authorization;
  removeEncryptedValue(config.USER_SESSION_KEY);
}

export async function getSessionData() {
  const sessionData = await getEncryptedData(config.USER_SESSION_KEY);
  return sessionData ? JSON.parse(sessionData) : null;
}

export const { init, login, signUp, logout } = createActions({
  INIT: (session, userCredentials, dbCredentials) =>
  {
    SyncToRemoteDatabase(dbCredentials, userCredentials.email);  //TODO: Delete after migrating to the new services, used for debugging purposes with old data.
    addTokenToHttpClient(session);
    return {
      session,
      password: userCredentials.password, username: userCredentials.email //TODO: Delete after migrating to the new services, used for debugging purposes with old data.
     };
  },
  LOGIN: (session, userCredentials, dbCredentials) => {
    storeEncryptedData(
      `dbCredentials_${userCredentials.email.replace(
        "@",
        ""
      )}`,
      dbCredentials
    ); //TODO: Delete after migrating to the new services, used for debugging purposes with old data.
    SyncToRemoteDatabase(dbCredentials, userCredentials.email);  //TODO: Delete after migrating to the new services, used for debugging purposes with old data.
    storeEncryptedData(`username`, userCredentials.email); //TODO: Delete after migrating to the new services, used for debugging purposes with old data.
    addTokenToHttpClient(session)
    storeSessionData(session);
    return {
      session,
      password: userCredentials.password, username: userCredentials.email //TODO: Delete after migrating to the new services, used for debugging purposes with old data.
     };
  },
  SIGN_UP: (session, userCredentials) => {
    storeEncryptedData(
      `dbCredentials_${userCredentials.email.replace(
        "@",
        ""
      )}`,
      dbCredentials
    );  //TODO: Delete after migrating to the new services, used for debugging purposes with old data.
    storeEncryptedData(`username`, userCredentials.email);//TODO: Delete after migrating to the new services, used for debugging purposes with old data.
    addTokenToHttpClient(session)
    storeSessionData(session);
    return { session, password: userCredentials.password, username: userCredentials.email };
  },
  LOGOUT: () =>
  {
    try {
      removeEncryptedValue("username"); //TODO: Delete after migrating to the new services, used for debugging purposes with old data.
      removeEncryptedValue("userPassword"); //TODO: Delete after migrating to the new services, used for debugging purposes with old data.
    } catch (error) {
      console.warn("No credentials to remove");
      
    }
    
    removeSessionData();
    logoutRemoteDBs();
    return {
      session: null, profile: null,
      password: null, username: null //TODO: Delete after migrating to the new services, used for debugging purposes with old data.
    };
  },
});

const authentication = handleActions(
  {
    [init]: (draft, { payload: { session, username, password } }) => {
      return draft.withMutations((state) => {
        state.set("session", session);
        state.set("username", username); //TODO: Delete after migrating to the new services, used for debugging purposes with old data.
        state.set("userPassword", password); //TODO: Delete after migrating to the new services, used for debugging purposes with old data.
      });
    },
    [login]: (draft, { payload: { session, username, password } }) => {
      return draft.withMutations((state) => {
        state.set("session", session);
        state.set("username", username); //TODO: Delete after migrating to the new services, used for debugging purposes with old data.
        state.set("userPassword", password); //TODO: Delete after migrating to the new services, used for debugging purposes with old data.
      });
    },
    [signUp]: (draft, { payload: { session, username, password } }) => {
      return draft.withMutations((state) => {
        state.set("session", session);
        state.set("username", username); //TODO: Delete after migrating to the new services, used for debugging purposes with old data.
        state.set("userPassword", password); //TODO: Delete after migrating to the new services, used for debugging purposes with old data.

      });
    },
    [logout]: (draft, { payload: { session, username, password } }) =>
    {
      return draft.withMutations((state) => {
        state.set("session", session);
        state.set("username", username); //TODO: Delete after migrating to the new services, used for debugging purposes with old data.
        state.set("userPassword", password); //TODO: Delete after migrating to the new services, used for debugging purposes with old data.
      });
    },
  },
  defaultState
);

export default authentication;
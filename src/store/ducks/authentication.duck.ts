import { Map } from "immutable";
import { createActions, handleActions } from "redux-actions";
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
  storeEncryptedData(config.USER_SESSION_KEY, JSON.stringify(sessionObject));
}

function storeProfileData(profileObject) {
  storeEncryptedData(config.USER_PROFILE_KEY, JSON.stringify(profileObject));
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

export async function getProfileData() {
  const profileData = await getEncryptedData(config.USER_PROFILE_KEY);
  return profileData ? JSON.parse(profileData) : null;
}

export const { init, login, signUp, setProfile, logout } = createActions({
  INIT: (session, profile) => {
    addTokenToHttpClient(session);
    return {
      session,
      profile,
    };
  },
  LOGIN: (session) => {
    addTokenToHttpClient(session);
    storeSessionData(session);
    return {
      session,
      
    };
  },
  SIGN_UP: (session) => {
    addTokenToHttpClient(session);
    storeSessionData(session);
    return { session };
  },
  SET_PROFILE: (profile) => {
    storeProfileData(profile);
    return { profile };
  },
  LOGOUT: () => {
    removeSessionData();
    return {
      session: null,
      profile: null,
    };
  },
});

const authentication = handleActions(
  {
    [init]: (draft, { payload: { session, profile } }) => {
      return draft.withMutations((state) => {
        state.set('session', session);
        state.set('profile', profile);
      
      });
    },
    [login]: (draft, { payload: { session } }) => {
      return draft.withMutations((state) => {
        state.set('session', session);
      });
    },
    [signUp]: (draft, { payload: { session, username, password } }) => {
      return draft.withMutations((state) => {
        state.set('session', session);
      });
    },
    [setProfile]: (draft, { payload: { profile } }) => {
      return draft.withMutations((state) => {
        state.set('profile', profile);
      });
    },
    [logout]: (draft, { payload: { session, profile, username, password } }) => {
      return draft.withMutations((state) => {
        state.set('session', session);
        state.set('profile', profile);
      });
    },
  },
  defaultState
);

export default authentication;
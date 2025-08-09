import PouchAuth from 'pouchdb-authentication';
import PouchFind from 'pouchdb-find';

import { baseURL } from '../services/authService';

import HttpPouch from 'pouchdb-adapter-http';
import sqliteAdapter from 'pouchdb-adapter-react-native-sqlite';
import PouchDB from 'pouchdb-core';
import mapreduce from 'pouchdb-mapreduce';
import replication from 'pouchdb-replication';
import config from '../../config';

export default PouchDB.plugin(HttpPouch)
  .plugin(replication)
  .plugin(mapreduce)
  .plugin(sqliteAdapter)
  .plugin(PouchAuth)
  .plugin(PouchFind)
  .plugin(require('pouchdb-upsert'));

// const BASE_URL = 'https://cdd.coso.gouv.bj/couchdb';
const BASE_URL = config.BASE_URL;
const RESOURCE_URL = baseURL;

  
let LocalAdminLevelsDatabase = {}
  try { 
    LocalAdminLevelsDatabase = new PouchDB('eadl', {
      adapter: 'react-native-sqlite',
    });
  } catch (error) {
    console.log(error)
  }
  
  
  let LocalGRMDatabase = {}
  try { 
    LocalGRMDatabase = new PouchDB('grm', {
      adapter: 'react-native-sqlite',
    });
  } catch (error) {
    console.log(error)
  }
  
  
  let LocalCommunesDatabase = {}
  try { 
    LocalCommunesDatabase = new PouchDB('commune', {
      adapter: 'react-native-sqlite',
    });
  } catch (error) {
    console.log(error)
  }
  
const adminLevelsRemoteDB = new PouchDB(`${BASE_URL}/administrative_levels`, {
  skip_setup: true,
});

const grmRemoteDB = new PouchDB(`${BASE_URL}/grm`, {
  skip_setup: true,
});

const communesRemoteDB = new PouchDB(`${BASE_URL}/administrative_levels`, {
  skip_setup: true,
});

export const ResourceUrl = RESOURCE_URL;

// Track active syncs
const activeSyncs = {
  adminLevels: null,
  grm: null,
  communes: null
};

export const SyncToRemoteDatabase = async ({ username, password }, userEmail) => {

  const levelsResult = { levels: [] };
  
  if (levelsResult.levels.length === 0) {
    await fetch(`${RESOURCE_URL}/authentication/get-adl-administrative-region?${new URLSearchParams({email: userEmail})}`)
      .then((response) => response.json())
      .then((a) => {levelsResult.levels = a?.levels})
      .catch((error) => ({ error }));
  }
  
  // if sync exists, do not create a new one
  // Prevent multiple syncs
  if (
    activeSyncs.adminLevels ||
    activeSyncs.grm ||
    activeSyncs.communes
  ) {
    console.warn("A sync is already running. Skipping new sync initialization.");
    return;
  }

  // start syncing the databases
  await loginRemoteDB(adminLevelsRemoteDB, "admin", "admin12345", "EADL");
  await loginRemoteDB(grmRemoteDB, "admin", "admin12345", "GRM");
  await loginRemoteDB(communesRemoteDB, "admin", "admin12345", "COMMUNES");

  // start syncing the databases
  console.log("Starting syncs for user: ", userEmail);

  // Sync the local databases with the remote ones
  activeSyncs.adminLevels = LocalAdminLevelsDatabase.sync(adminLevelsRemoteDB, {
    live: true,
    retry: true,
    filter: "eadl/by_user_email",
    query_params: { email: userEmail },
  });

  activeSyncs.communes = LocalCommunesDatabase.sync(communesRemoteDB, {
    live: true,
    retry: true,
    filter: "eadl/by_user_administrative_region",
    query_params: { ids: levelsResult?.levels },
  });

 
  const opts = { live: true, retry: true };
  // do one way, one-off sync from the server until completion
  LocalGRMDatabase.replicate.from(grmRemoteDB).on("complete", function (info) {
    // then two-way, continuous, retriable sync
    activeSyncs.grm = LocalGRMDatabase.sync(grmRemoteDB, opts);
    const syncStates = [
      "change",
      "paused",
      "active",
      "denied",
      "complete",
      "error",
    ];
    
    syncStates.forEach((state) =>
    {
      activeSyncs.grm.on(state, async (currState) => {
        if (currState && currState.status === 401) {
          console.warn("SyncGRM unauthorized, attempting re-login...");
          await loginRemoteDB(grmRemoteDB, "admin", "admin12345", "GRM");
          activeSyncs.grm.resume();
        }
        console.log(`[Sync GRM ${state}: ${JSON.stringify(currState)}]`);
      });
    });
  }).on("error", (error) => {
    console.log(
      "Error on initial replication from grm remote db into local grm db: ",
      error
    );
  });

  // Log sync states for debugging
  const syncStates = [
    "change",
    "paused",
    "active",
    "denied",
    "complete",
    "error",
  ];
  syncStates.forEach((state) => {
    activeSyncs.adminLevels.on(state, async (currState) => {
      if (currState && currState.status === 401) {
        console.warn(state);
        console.warn(
          "SyncAdminLevels unauthorized, attempting re-login..."
        );
        await loginRemoteDB(
          adminLevelsRemoteDB,
          "admin",
          "admin12345",
          "EADL"
        );
        activeSyncs.adminLevels.resume();
      }

      console.log(`[Sync EADL ${state}: ${JSON.stringify(currState)}]`);
    });

    activeSyncs.communes.on(state, async (currState) => {
      if (currState && currState.status === 401) {
        console.warn("SyncCommunes unauthorized, attempting re-login...");
        await loginRemoteDB(
          communesRemoteDB,
          "admin",
          "admin12345",
          "COMMUNES"
        );
        activeSyncs.communes.resume();
      }
      console.log(`[Sync COMMUNES ${state}: ${JSON.stringify(currState)}]`);
    });
  });
};

const removeAllSyncListeners = () => {
  try {
    LocalAdminLevelsDatabase.removeAllListeners();
    LocalGRMDatabase.removeAllListeners();
    LocalCommunesDatabase.removeAllListeners();
  } catch (error) {
    console.error("Error removing all sync listeners:", error);
  }
};

async function loginRemoteDB(db, username, password, label, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await db.logIn(username, password);
      console.log(`Logged in to ${label} remote database`);
      return;
    } catch (error) {
      if (error.message && error.message.includes('ETIMEDOUT') && i < retries - 1) {
        console.warn(`Timeout logging in to ${label}, retrying... (${i + 1})`);
        await new Promise(res => setTimeout(res, 2000));
      } else {
        console.error(`Error logging in to ${label} remote database:`, error);
        break;
      }
    }
  }
}

export function resumeSyncs() {
  if (LocalAdminLevelsDatabase && typeof LocalAdminLevelsDatabase.resume === "function") {
    LocalAdminLevelsDatabase.resume();
  }
  if (LocalGRMDatabase && typeof LocalGRMDatabase.resume === "function") {
    LocalGRMDatabase.resume();
  }
  if (LocalCommunesDatabase && typeof LocalCommunesDatabase.resume === "function") {
    LocalCommunesDatabase.resume();
  }
}

export const logoutRemoteDBs = async () => {
  removeAllSyncListeners();
  cancelSyncs();

  try {
    await logoutRemoteDB(adminLevelsRemoteDB, "EADL");
    await logoutRemoteDB(grmRemoteDB, "GRM");
    await logoutRemoteDB(communesRemoteDB, "COMMUNES");
  } catch (error) {
    console.error("Error during logout from remote databases:", error);
  }
}


async function logoutRemoteDB(db, label) {
try {
  await db.logOut();
  console.log(`Logged out from ${label} remote database`);
} catch (error) {
  console.error(`Error logging out from ${label} remote database:`, error);
}
}

// cancel sync
export const cancelSyncs = () =>
{
  try {
    if (activeSyncs.adminLevels) {
      activeSyncs.adminLevels.cancel();
      activeSyncs.adminLevels = null;
    }
    if (activeSyncs.grm) {
      activeSyncs.grm.cancel();
      activeSyncs.grm = null;
    }
    if (activeSyncs.communes) {
      activeSyncs.communes.cancel();
      activeSyncs.communes = null;
    }
      LocalAdminLevelsDatabase.cancel();
      LocalGRMDatabase.cancel();
      LocalCommunesDatabase.cancel();
  } catch (error) {
    console.error("Error canceling syncs:", error);
  }
  
};


// export the databases
export { LocalAdminLevelsDatabase, LocalCommunesDatabase, LocalGRMDatabase };


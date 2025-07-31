import PouchDB from 'pouchdb-react-native';
import PouchAuth from 'pouchdb-authentication';
import PouchFind from 'pouchdb-find';
import PouchAsyncStorage from 'pouchdb-adapter-asyncstorage';
import { baseURL } from '../services/API';
const BASE_URL = 'https://cdd.coso.gouv.bj/couchdb';
// const BASE_URL = 'http://10.0.2.2:5984';
const RESOURCE_URL = baseURL;
PouchDB.plugin(PouchAuth);
PouchDB.plugin(PouchFind);
PouchDB.plugin(require('pouchdb-upsert'));

PouchDB.plugin(PouchAsyncStorage);

const LocalAdminLevelsDatabase = new PouchDB('eadl', {
  adapter: 'asyncstorage',
});

const LocalGRMDatabase = new PouchDB('grm', {
  adapter: 'asyncstorage',
});

const LocalCommunesDatabase = new PouchDB('commune', {
  adapter: 'asyncstorage',
});

export const ResourceUrl = RESOURCE_URL;

export const SyncToRemoteDatabase = async ({ username, password }, userEmail) => {
  const adminLevelsRemoteDB = new PouchDB(`${BASE_URL}/administrative_levels`, {
    skip_setup: true,
  });

  const grmRemoteDB = new PouchDB(`${BASE_URL}/grm`, {
    skip_setup: true,
  });

  const communesRemoteDB = new PouchDB(`${BASE_URL}/administrative_levels`, {
    skip_setup: true,
  });

  const result = {levels: []};
  if (result.levels.length === 0) {
    await fetch(`${RESOURCE_URL}/authentication/get-adl-administrative-region?${new URLSearchParams({email: userEmail})}`)
      .then((response) => response.json())
      .then((a) => {result.levels = a?.levels})
      .catch((error) => ({ error }));
  }

  async function loginRemoteDB(db, username, password, label) {
    try {
      await db.logIn(username, password);
      console.log(`Logged in to ${label} remote database`);
    } catch (error) {
      console.error(`Error logging in to ${label} remote database:`, error);
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

  await loginRemoteDB(adminLevelsRemoteDB, username, password, 'EADL');
  await loginRemoteDB(grmRemoteDB, username, password, 'GRM');
  await loginRemoteDB(communesRemoteDB, username, password, 'COMMUNES');
  
  const syncAdminLevelsDB = LocalAdminLevelsDatabase.sync(adminLevelsRemoteDB, {
    live: true,
    retry: true,
    filter: 'eadl/by_user_email',
    query_params: { email: userEmail },
  });

  const syncCommunes = LocalCommunesDatabase.sync(communesRemoteDB, {
    live: true,
    retry: true,
    filter: "eadl/by_user_administrative_region",
    query_params: { ids: result?.levels },
  });
  
  let syncGRM;
  const opts = { live: true, retry: true };
  // do one way, one-off sync from the server until completion
  LocalGRMDatabase.replicate.from(grmRemoteDB).on('complete', function (info)
  {

    console.log("Initial replication from grm remote db into local grm db completed: ", info);  
    // then two-way, continuous, retriable sync
    // moved syncing listening events here to avoid defining it without the db being ready
    syncGRM = LocalGRMDatabase.sync(grmRemoteDB, opts)
    const syncStates = ['change', 'paused', 'active', 'denied', 'complete', 'error'];
    syncStates.forEach((state) =>
    {
      syncGRM.on(state, async (currState) =>
      {
        if (currState && currState.status === 401) {
          console.warn('SyncGRM unauthorized, attempting re-login...');
          await loginRemoteDB(grmRemoteDB, username, password, 'GRM');
          syncGRM.resume();
        }
        console.log(`[Sync GRM ${state}: ${JSON.stringify(currState)}]`);
      });
       
    }
    );
  }).on('error', (error) =>
  { 
    console.log("Error on initial replication from grm remote db into local grm db: ", err);
  });

  
  // Log sync states for debugging
  const syncStates = ['change', 'paused', 'active', 'denied', 'complete', 'error'];
  syncStates.forEach((state) => {
    syncAdminLevelsDB.on(state, async (currState) =>
    { 
        if (currState && currState.status === 401) {
          console.warn(state);
          console.warn('SyncAdminLevels unauthorized, attempting re-login...');
          await loginRemoteDB(adminLevelsRemoteDB, username, password, 'EADL');
          syncAdminLevelsDB.resume();
        }
      
        console.log(`[Sync EADL ${state}: ${JSON.stringify(currState)}]`)
      }
    );
    
    syncCommunes.on(state, async (currState) =>
    { 
      if (currState && currState.status === 401) {
        console.warn('SyncCommunes unauthorized, attempting re-login...');
        await loginRemoteDB(communesRemoteDB, username, password, 'COMMUNES');
        syncCommunes.resume();
      }
      console.log(`[Sync COMMUNES ${state}: ${JSON.stringify(currState)}]`)
    }
    );

  });
};

// cancel sync
export const cancelSyncs = () => {
  LocalAdminLevelsDatabase.cancel();
  LocalGRMDatabase.cancel();
  LocalCommunesDatabase.cancel();
};

// export the databases
export { LocalAdminLevelsDatabase, LocalGRMDatabase, LocalCommunesDatabase };

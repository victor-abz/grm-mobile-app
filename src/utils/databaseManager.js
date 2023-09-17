import PouchAsyncStorage from 'pouchdb-adapter-asyncstorage';
import PouchAuth from 'pouchdb-authentication';
import PouchFind from 'pouchdb-find';
import PouchDB from 'pouchdb-react-native';

const BASE_URL = 'http://192.168.43.236:5984';
const RESOURCE_URL = 'http://192.168.43.236:8000';
PouchDB.plugin(PouchAuth);
PouchDB.plugin(PouchFind);
PouchDB.plugin(require('pouchdb-upsert'));

PouchDB.plugin(PouchAsyncStorage);

const LocalDatabase = new PouchDB('eadl', {
  adapter: 'asyncstorage',
});

export const LocalGRMDatabase = new PouchDB('grm', {
  adapter: 'asyncstorage',
  ajax: { cache: false },
});

export const LocalCommunesDatabase = new PouchDB('commune', {
  adapter: 'asyncstorage',
});

export const ResourceUrl = RESOURCE_URL;

export const SyncToRemoteDatabase = async ({ username, password }, userEmail) => {
  const remoteDB = new PouchDB(`${BASE_URL}/eadls`, {
    skip_setup: true,
    auto_compaction: true,
  });

  const grmRemoteDB = new PouchDB(`${BASE_URL}/grm`, {
    skip_setup: true,
    ajax: { cache: false },
    auto_compaction: true,
  });

  const communesRemoteDB = new PouchDB(`${BASE_URL}/eadls`, {
    skip_setup: true,
    auto_compaction: true,
  });

  const result = { levels: [] };

  if (result.levels.length === 0) {
    await fetch(
      `${RESOURCE_URL}/authentication/get-adl-administrative-region?${new URLSearchParams({
        email: userEmail,
      })}`
    )
      .then((response) => response.json())
      .then((a) => {
        result.levels = a?.levels;
      })
      .catch((error) => ({ error }));
  }

  await remoteDB.login(username, password);
  await grmRemoteDB.login(username, password);

  const sync = LocalDatabase.sync(remoteDB, {
    live: true,
    retry: true,
    filter: 'eadl/by_user_email',
    query_params: { email: userEmail },
  });

  const syncCommunes = LocalCommunesDatabase.sync(communesRemoteDB, {
    live: true,
    retry: true,
    // view: "eadl/all_administrative_levels",
    // filter: "eadl/all_communes",
    // query_params: { email: userEmail },
    filter: 'eadl/by_user_administrative_region',
    query_params: { ids: result?.levels },
  });

  const syncGRM = LocalGRMDatabase.sync(grmRemoteDB, {
    live: true,
    retry: true,
    batch_size: 500,
    batches_limit: 50,
  });
  const syncStates = ['change', 'paused', 'active', 'denied', 'complete', 'error'];
  syncStates.forEach((state) => {
    sync.on(state, (currState) =>
      console.log(`[Sync EADL ${state}: ${JSON.stringify(currState)}]`)
    );

    syncCommunes.on(state, (currState) =>
      console.log(currState, `[Sync COMMUNES ${state}: ${JSON.stringify(currState)}]`)
    );

    syncGRM.on(state, (currState) =>
      console.log(`[Sync GRM ${state}: ${JSON.stringify(currState)}]`)
    );
  });

  // Cancel synchronization after 10 seconds
  setTimeout(() => {
    sync.cancel();
    syncCommunes.cancel();
    syncGRM.cancel();
    console.log('Synchronization cancelled');
  }, 20000);
};

export default LocalDatabase;

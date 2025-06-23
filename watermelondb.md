
I have `DataManager.js`, `FrappeSyncManager.js`, and `databaseManager.js`. My goal is to move away from PouchDB and its associated `AsyncStorage` backend to a more robust and performant solution for a true offline-first experience, without retaining any backward compatibility.

### Analysis of Current State

My current setup uses PouchDB (`LocalDatabase`, `LocalGRMDatabase`) as the local data store.  `/Users/victor/Documents/dev/grm-mobile-app/src/services/FrappeSyncManager.js` is a custom-built solution to synchronize this local database with my Frappe backend. It handles creating, updating, and pushing changes, as well as pulling updates from the server. This is a classic offline-first pattern,I have noted, PouchDB in React Native (which often relies on `AsyncStorage` adapters) have performance and storage limitations.

The goal is to replace the PouchDB layer with a high-performance database designed for native mobile applications, entirely using Watermelon

---

###  Migrate to WatermelonDB 🍉
WatermelonDB is an open-source reactive database framework designed specifically for building complex, high-performance React and React Native applications. It's built on top of a rock-solid SQLite foundation, is incredibly fast, and is architected for robust offline-first synchronization.

**Proposed Implementation Plan:**

1.  **Install and Configure:** Add WatermelonDB to my project and configure the native SQLite adapter for iOS and Android.

2.  **Refactor `/Users/victor/Documents/dev/grm-mobile-app/src/services/DataManager.js`:**
    *   Refactor getIssues to use WatermelonDB getIssue query.  `getIssues` would be rewritten to use `database.get('issues').query(...)`. it should use backend API frappe call  await call.get('egrm.api.issue.get_latest_issues', filterParams);
    *   Don't do the conversion of data from backend to UI, we should keep the data as in format they come from backend
    *   Other parts of Datamanager should continue using legacy methods
  
3.  **Refactor `/Users/victor/Documents/dev/grm-mobile-app/src/screens/Home/IssueSearch/IssueSearch.js`:** This is where the biggest improvement comes.
    *   to use the `withObservables` HOC or React hooks to connect directly to WatermelonDB queries, making the UI effortlessly reactive.
    *   Make it display the data as they come from backend instead of old structure(no comversion or mapping)
4.  

**Instructions**
2.  **Schemas:**: WaterMelonDb Models Schemas are defined in `/Users/victor/Documents/dev/grm-mobile-app/src/database` 
3.  **APIs**: For backend we have API defined for sync defined in `/Users/victor/egrm/apps/egrm/egrm/api/sync.py`, learn it and keep using the part for issues. don't modify other parts of it.
4.  Don't modify other parts of the codes not mentioned. this is MVP for watermelon.
5.  For Watermelon, create its own database manager, don't disrupt the existing databaseManager. this to prepare for gradual migration. part by part. Don't create new DataManager, just put in existing Datamanager and for MVPP only modify the getIssues to use WaterMelon Completely.
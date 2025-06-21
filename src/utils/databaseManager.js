import PouchAsyncStorage from 'pouchdb-adapter-asyncstorage';
import PouchAuth from 'pouchdb-authentication';
import PouchFind from 'pouchdb-find';
import PouchDB from 'pouchdb-react-native';

// Enable debugging for development
if (__DEV__) {
  PouchDB.debug.enable('*');
  PouchDB.debug.enable('pouchdb:find');
}

// Configure PouchDB plugins
PouchDB.plugin(PouchAuth);
PouchDB.plugin(PouchFind);
PouchDB.plugin(require('pouchdb-upsert'));
PouchDB.plugin(PouchAsyncStorage);

// Database instances for local storage (offline-first approach)
export const LocalDatabase = new PouchDB('eadl', {
  adapter: 'asyncstorage',
});

export const LocalGRMDatabase = new PouchDB('grm', {
  adapter: 'asyncstorage',
  ajax: { cache: false },
});

export const LocalCommunesDatabase = new PouchDB('eadl', {
  adapter: 'asyncstorage',
});

/**
 * Legacy sync function - now uses the new DataManager
 * @deprecated Use dataManager.performSync() instead
 */
export const SyncToRemoteDatabase = async ({ username, password }, userEmail) => {
  console.warn('SyncToRemoteDatabase is deprecated. Use dataManager.performSync() instead.');

  try {
    const { default: dataManager } = await import('../services/DataManager');
    const credentials = { username: userEmail || username, password };
    await dataManager.setCredentials(credentials);
    await dataManager.performSync();
    console.log('Legacy sync completed using new system');
  } catch (error) {
    console.error('Legacy sync failed:', error);
    throw error;
  }
};

/**
 * Data Manager utility functions
 */
const getDataManager = async () => {
  const { default: dataManager } = await import('../services/DataManager');
  return dataManager;
};

/**
 * Initialize the data management system
 */
export const initializeDataManager = async (credentials = null) => {
  try {
    const dataManager = await getDataManager();
    await dataManager.initialize(credentials);
    console.log('✅ Data manager initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize data manager:', error);
    throw error;
  }
};

/**
 * Set credentials for the data manager
 */
export const setDataManagerCredentials = async (credentials) => {
  try {
    const dataManager = await getDataManager();
    await dataManager.setCredentials(credentials);
    console.log('✅ Credentials set successfully');
  } catch (error) {
    console.error('❌ Failed to set data manager credentials:', error);
    throw error;
  }
};

/**
 * Issue Management Functions
 */
export const getIssues = async (filters = {}) => {
  const dataManager = await getDataManager();
  return await dataManager.getIssues(filters);
};

export const getIssue = async (issueId) => {
  const dataManager = await getDataManager();
  return await dataManager.getIssue(issueId);
};

export const updateIssue = async (issueId, updateData) => {
  const dataManager = await getDataManager();
  return await dataManager.updateIssue(issueId, updateData);
};

export const deleteIssue = async (issueId) => {
  const dataManager = await getDataManager();
  return await dataManager.deleteIssue(issueId);
};

/**
 * Lookup Data Functions
 */
export const getAdministrativeRegions = async (filters = {}) => {
  const dataManager = await getDataManager();
  return await dataManager.getAdministrativeRegions(filters);
};

export const getIssueCategories = async (projectId = null) => {
  const dataManager = await getDataManager();
  return await dataManager.getIssueCategories(projectId);
};

export const getIssueTypes = async (projectId = null) => {
  const dataManager = await getDataManager();
  return await dataManager.getIssueTypes(projectId);
};

export const getIssueStatuses = async () => {
  const dataManager = await getDataManager();
  return await dataManager.getIssueStatuses();
};

export const getAgeGroups = async () => {
  const dataManager = await getDataManager();
  return await dataManager.getAgeGroups();
};

export const getCitizenGroups = async () => {
  const dataManager = await getDataManager();
  return await dataManager.getCitizenGroups();
};

export const getDepartments = async () => {
  const dataManager = await getDataManager();
  return await dataManager.getDepartments();
};

export const getProjects = async () => {
  const dataManager = await getDataManager();
  return await dataManager.getProjects();
};

/**
 * Attachment Functions
 */
export const uploadAttachment = async (issueId, attachmentData) => {
  const dataManager = await getDataManager();
  return await dataManager.uploadAttachment(issueId, attachmentData);
};

export const getIssueAttachments = async (issueId) => {
  const dataManager = await getDataManager();
  return await dataManager.getIssueAttachments(issueId);
};

/**
 * Search Functions
 */
export const searchIssues = async (searchTerm, filters = {}) => {
  const dataManager = await getDataManager();
  return await dataManager.searchIssues(searchTerm, filters);
};

/**
 * User-specific Functions
 */
export const getUserAssignedIssues = async (userId) => {
  const dataManager = await getDataManager();
  return await dataManager.getUserAssignedIssues(userId);
};

export const getUserReportedIssues = async (userId) => {
  const dataManager = await getDataManager();
  return await dataManager.getUserReportedIssues(userId);
};

export const getIssuesByStatus = async (statusId, userId = null) => {
  const dataManager = await getDataManager();
  return await dataManager.getIssuesByStatus(statusId, userId);
};

/**
 * Statistics Functions
 */
export const getStatistics = async (userId = null) => {
  const dataManager = await getDataManager();
  return await dataManager.getStatistics(userId);
};

/**
 * Sync Functions
 */
export const performSync = async (projectId = null) => {
  const dataManager = await getDataManager();
  return await dataManager.performSync(projectId);
};

export const getSyncStatus = async () => {
  const dataManager = await getDataManager();
  return dataManager.getSyncStatus();
};

export const addSyncListener = async (listener) => {
  const dataManager = await getDataManager();
  return dataManager.addSyncListener(listener);
};

export const removeSyncListener = async (listener) => {
  const dataManager = await getDataManager();
  return dataManager.removeSyncListener(listener);
};

export const forceFullResync = async (projectId = null) => {
  const dataManager = await getDataManager();
  return await dataManager.forceFullResync(projectId);
};

/**
 * Network Functions
 */
export const isNetworkOnline = async () => {
  const dataManager = await getDataManager();
  return dataManager.isNetworkOnline();
};

/**
 * Data Management Functions
 */
export const clearAllData = async () => {
  const dataManager = await getDataManager();
  return await dataManager.clearAllData();
};

export const exportData = async () => {
  const dataManager = await getDataManager();
  return await dataManager.exportData();
};

export const importData = async (backupData) => {
  const dataManager = await getDataManager();
  return await dataManager.importData(backupData);
};

export const forceCleanupDatabases = async () => {
  try {
    const dataManager = await getDataManager();
    return await dataManager.forceCleanupDatabases();
  } catch (error) {
    console.error('❌ Failed to force cleanup databases:', error);
    throw error;
  }
};

// Export database instances for compatibility
export default LocalDatabase;

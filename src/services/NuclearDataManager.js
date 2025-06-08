import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { LocalDatabase, LocalGRMDatabase } from '../utils/databaseManager';

// Emergency operation constants
const OPERATION_TYPES = {
  CLEANUP: 'cleanup',
  RESET: 'reset',
  REPAIR: 'repair',
  COMPACT: 'compact',
};

const STORAGE_KEYS = {
  NUCLEAR_RESET_COUNT: 'nuclear_reset_count',
  LAST_EMERGENCY_OPERATION: 'last_emergency_operation',
  DATABASE_HEALTH_STATUS: 'database_health_status',
};

// Error patterns that indicate serious database issues
const CRITICAL_ERROR_PATTERNS = [
  /SQLITE_FULL/i,
  /database.*full/i,
  /disk.*full/i,
  /no.*space/i,
  /quota.*exceeded/i,
  /storage.*full/i,
  /SQLITE_CORRUPT/i,
  /database.*corrupt/i,
  /malformed/i,
];

/**
 * Database health monitoring and emergency operations
 */
class NuclearDataManager {
  constructor() {
    this.operationInProgress = false;
    this.healthStats = {
      lastCheck: null,
      status: 'unknown',
      issues: [],
      documentsCount: 0,
      storageUsed: 0,
    };
  }

  /**
   * Check if error indicates critical database issues
   */
  isCriticalError(error) {
    const errorMessage = error?.message || error?.toString() || '';
    return CRITICAL_ERROR_PATTERNS.some((pattern) => pattern.test(errorMessage));
  }

  /**
   * Perform health check on databases
   */
  async performHealthCheck() {
    console.log('🔍 Performing database health check...');

    try {
      const [grmStats, eadlStats] = await Promise.all([
        this.getDatabaseStats(LocalGRMDatabase, 'GRM'),
        this.getDatabaseStats(LocalDatabase, 'EADL'),
      ]);

      this.healthStats = {
        lastCheck: new Date().toISOString(),
        status: 'healthy',
        issues: [],
        grm: grmStats,
        eadl: eadlStats,
        documentsCount: grmStats.documentCount + eadlStats.documentCount,
        storageUsed: grmStats.storageSize + eadlStats.storageSize,
      };

      // Check for potential issues
      await this.analyzeHealthIssues();

      console.log('✅ Health check completed:', this.healthStats);
      await this.saveHealthStatus();

      return this.healthStats;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      this.healthStats.status = 'error';
      this.healthStats.issues.push(`Health check failed: ${error.message}`);
      return this.healthStats;
    }
  }

  /**
   * Get statistics for a specific database
   */
  async getDatabaseStats(database, name) {
    try {
      const allDocs = await database.allDocs({ include_docs: true });
      const docs = allDocs.rows.map((row) => row.doc);

      const stats = {
        name,
        documentCount: docs.length,
        storageSize: this.estimateStorageSize(docs),
        oldestDocument: this.getOldestDocument(docs),
        newestDocument: this.getNewestDocument(docs),
        typeCounts: this.getDocumentTypeCounts(docs),
      };

      return stats;
    } catch (error) {
      console.error(`❌ Error getting stats for ${name}:`, error);
      return {
        name,
        error: error.message,
        documentCount: 0,
        storageSize: 0,
      };
    }
  }

  /**
   * Estimate storage size of documents
   */
  estimateStorageSize(docs) {
    return docs.reduce((total, doc) => {
      return total + JSON.stringify(doc).length;
    }, 0);
  }

  /**
   * Get oldest document based on creation date
   */
  getOldestDocument(docs) {
    if (docs.length === 0) return null;

    return docs.reduce((oldest, doc) => {
      const docDate = new Date(doc.created_date || doc.creation || doc._rev || 0);
      const oldestDate = new Date(oldest.created_date || oldest.creation || oldest._rev || 0);
      return docDate < oldestDate ? doc : oldest;
    });
  }

  /**
   * Get newest document based on creation date
   */
  getNewestDocument(docs) {
    if (docs.length === 0) return null;

    return docs.reduce((newest, doc) => {
      const docDate = new Date(doc.created_date || doc.creation || doc._rev || 0);
      const newestDate = new Date(newest.created_date || newest.creation || newest._rev || 0);
      return docDate > newestDate ? doc : newest;
    });
  }

  /**
   * Count documents by type
   */
  getDocumentTypeCounts(docs) {
    const counts = {};
    docs.forEach((doc) => {
      const type = doc.type || 'unknown';
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }

  /**
   * Analyze potential health issues
   */
  async analyzeHealthIssues() {
    const issues = [];

    // Check for excessive storage usage
    if (this.healthStats.storageUsed > 50 * 1024 * 1024) {
      // 50MB
      issues.push('High storage usage detected');
    }

    // Check for excessive document count
    if (this.healthStats.documentsCount > 10000) {
      issues.push('Large number of documents may impact performance');
    }

    // Check database integrity
    const integrityIssues = await this.checkDatabaseIntegrity();
    issues.push(...integrityIssues);

    this.healthStats.issues = issues;
    this.healthStats.status = issues.length > 0 ? 'warning' : 'healthy';
  }

  /**
   * Check database integrity
   */
  async checkDatabaseIntegrity() {
    const issues = [];

    try {
      // Test basic operations on both databases
      await Promise.all([
        this.testDatabaseOperations(LocalGRMDatabase, 'GRM'),
        this.testDatabaseOperations(LocalDatabase, 'EADL'),
      ]);
    } catch (error) {
      if (this.isCriticalError(error)) {
        issues.push(`Critical database error: ${error.message}`);
      } else {
        issues.push(`Database operation failed: ${error.message}`);
      }
    }

    return issues;
  }

  /**
   * Test basic database operations
   */
  async testDatabaseOperations(database, name) {
    const testDoc = {
      _id: `test_${Date.now()}`,
      type: 'health_test',
      timestamp: new Date().toISOString(),
    };

    try {
      // Test write
      await database.put(testDoc);

      // Test read
      const retrieved = await database.get(testDoc._id);

      // Test delete
      await database.remove(retrieved);

      console.log(`✅ ${name} database operations test passed`);
    } catch (error) {
      console.error(`❌ ${name} database operations test failed:`, error);
      throw error;
    }
  }

  /**
   * Save health status to persistent storage
   */
  async saveHealthStatus() {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.DATABASE_HEALTH_STATUS,
        JSON.stringify(this.healthStats)
      );
    } catch (error) {
      console.error('❌ Error saving health status:', error);
    }
  }

  /**
   * Load health status from persistent storage
   */
  async loadHealthStatus() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.DATABASE_HEALTH_STATUS);
      if (stored) {
        this.healthStats = JSON.parse(stored);
      }
    } catch (error) {
      console.error('❌ Error loading health status:', error);
    }
  }

  /**
   * Emergency cleanup operation
   */
  async emergencyCleanup() {
    if (this.operationInProgress) {
      console.log('⚠️ Emergency operation already in progress');
      return { success: false, message: 'Operation already in progress' };
    }

    this.operationInProgress = true;

    try {
      console.log('🚨 Starting emergency database cleanup...');

      const strategies = [
        () => this.cleanupStrategy1_RemoveOldDocuments(),
        () => this.cleanupStrategy2_CompactDatabases(),
        () => this.cleanupStrategy3_SelectiveCleanup(),
        () => this.cleanupStrategy4_AggressiveCleanup(),
      ];

      for (let i = 0; i < strategies.length; i++) {
        const strategy = strategies[i];
        console.log(`🔧 Attempting cleanup strategy ${i + 1}/${strategies.length}...`);

        try {
          const result = await strategy();
          if (result.success) {
            await this.recordEmergencyOperation(
              OPERATION_TYPES.CLEANUP,
              `Strategy ${i + 1} successful`
            );
            console.log(`✅ Emergency cleanup completed with strategy ${i + 1}`);
            return result;
          }
        } catch (strategyError) {
          console.warn(`⚠️ Cleanup strategy ${i + 1} failed:`, strategyError.message);
          // Continue to next strategy
        }
      }

      throw new Error('All cleanup strategies failed');
    } catch (error) {
      console.error('❌ Emergency cleanup failed completely:', error);
      return { success: false, message: error.message };
    } finally {
      this.operationInProgress = false;
    }
  }

  /**
   * Cleanup Strategy 1: Remove old documents
   */
  async cleanupStrategy1_RemoveOldDocuments() {
    console.log('🧹 Strategy 1: Removing old documents...');

    const [grmDocs, eadlDocs] = await Promise.all([
      LocalGRMDatabase.allDocs({ include_docs: true }),
      LocalDatabase.allDocs({ include_docs: true }),
    ]);

    const totalBefore = grmDocs.rows.length + eadlDocs.rows.length;

    // Keep only 70% of newest documents from each database
    await Promise.all([
      this.removeOldDocuments(LocalGRMDatabase, grmDocs.rows, 0.7),
      this.removeOldDocuments(LocalDatabase, eadlDocs.rows, 0.7),
    ]);

    const [grmAfter, eadlAfter] = await Promise.all([
      LocalGRMDatabase.allDocs(),
      LocalDatabase.allDocs(),
    ]);

    const totalAfter = grmAfter.rows.length + eadlAfter.rows.length;
    const removed = totalBefore - totalAfter;

    console.log(`✅ Strategy 1 completed: Removed ${removed} documents`);

    return {
      success: removed > 0,
      message: `Removed ${removed} old documents`,
      documentsRemoved: removed,
    };
  }

  /**
   * Cleanup Strategy 2: Compact databases
   */
  async cleanupStrategy2_CompactDatabases() {
    console.log('🗜️ Strategy 2: Compacting databases...');

    try {
      await Promise.all([
        this.compactDatabase(LocalGRMDatabase, 'GRM'),
        this.compactDatabase(LocalDatabase, 'EADL'),
      ]);

      return {
        success: true,
        message: 'Databases compacted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: `Compaction failed: ${error.message}`,
      };
    }
  }

  /**
   * Cleanup Strategy 3: Selective cleanup based on document types
   */
  async cleanupStrategy3_SelectiveCleanup() {
    console.log('🎯 Strategy 3: Selective cleanup by document type...');

    const cleanupTasks = [
      () => this.cleanupDocumentType('attachment', 0.5), // Keep 50% of attachments
      () => this.cleanupDocumentType('log', 0.3), // Keep 30% of logs
      () => this.cleanupDocumentType('cache', 0.1), // Keep 10% of cache
    ];

    let totalRemoved = 0;

    for (const task of cleanupTasks) {
      try {
        const result = await task();
        totalRemoved += result.removed || 0;
      } catch (error) {
        console.warn('⚠️ Selective cleanup task failed:', error.message);
      }
    }

    return {
      success: totalRemoved > 0,
      message: `Selectively removed ${totalRemoved} documents`,
      documentsRemoved: totalRemoved,
    };
  }

  /**
   * Cleanup Strategy 4: Aggressive cleanup (last resort)
   */
  async cleanupStrategy4_AggressiveCleanup() {
    console.log('💥 Strategy 4: Aggressive cleanup (last resort)...');

    try {
      // Keep only essential documents
      const [grmDocs, eadlDocs] = await Promise.all([
        LocalGRMDatabase.allDocs({ include_docs: true }),
        LocalDatabase.allDocs({ include_docs: true }),
      ]);

      const essentialTypes = ['issue', 'project', 'issue_category', 'issue_type'];

      const totalBefore = grmDocs.rows.length + eadlDocs.rows.length;

      // Remove non-essential documents
      await Promise.all([
        this.removeNonEssentialDocuments(LocalGRMDatabase, grmDocs.rows, essentialTypes),
        this.removeNonEssentialDocuments(LocalDatabase, eadlDocs.rows, essentialTypes),
      ]);

      const [grmAfter, eadlAfter] = await Promise.all([
        LocalGRMDatabase.allDocs(),
        LocalDatabase.allDocs(),
      ]);

      const totalAfter = grmAfter.rows.length + eadlAfter.rows.length;
      const removed = totalBefore - totalAfter;

      return {
        success: removed > 0,
        message: `Aggressively removed ${removed} non-essential documents`,
        documentsRemoved: removed,
      };
    } catch (error) {
      return {
        success: false,
        message: `Aggressive cleanup failed: ${error.message}`,
      };
    }
  }

  /**
   * Remove old documents keeping specified percentage of newest
   */
  async removeOldDocuments(database, rows, keepPercentage) {
    if (rows.length === 0) return 0;

    const docs = rows.map((row) => row.doc);
    const sortedDocs = docs.sort((a, b) => {
      const dateA = new Date(a.modified_date || a.creation || a._rev || 0);
      const dateB = new Date(b.modified_date || b.creation || b._rev || 0);
      return dateB - dateA; // Newest first
    });

    const keepCount = Math.floor(sortedDocs.length * keepPercentage);
    const docsToDelete = sortedDocs.slice(keepCount);

    await this.batchDelete(database, docsToDelete);
    return docsToDelete.length;
  }

  /**
   * Cleanup documents of specific type
   */
  async cleanupDocumentType(type, keepPercentage) {
    const databases = [
      { db: LocalGRMDatabase, name: 'GRM' },
      { db: LocalDatabase, name: 'EADL' },
    ];

    let totalRemoved = 0;

    for (const { db, name } of databases) {
      try {
        const result = await db.find({ selector: { type } });
        if (result.docs.length > 0) {
          const removed = await this.removeOldDocuments(
            db,
            result.docs.map((doc) => ({ doc })),
            keepPercentage
          );
          totalRemoved += removed;
          console.log(`🗑️ Removed ${removed} ${type} documents from ${name}`);
        }
      } catch (error) {
        console.warn(`⚠️ Error cleaning ${type} from ${name}:`, error.message);
      }
    }

    return { removed: totalRemoved };
  }

  /**
   * Remove non-essential documents
   */
  async removeNonEssentialDocuments(database, rows, essentialTypes) {
    const docs = rows.map((row) => row.doc);
    const nonEssentialDocs = docs.filter((doc) => !essentialTypes.includes(doc.type));

    await this.batchDelete(database, nonEssentialDocs);
    return nonEssentialDocs.length;
  }

  /**
   * Compact database (if supported by PouchDB implementation)
   */
  async compactDatabase(database, name) {
    try {
      if (typeof database.compact === 'function') {
        await database.compact();
        console.log(`✅ ${name} database compacted`);
      } else {
        console.log(`ℹ️ ${name} database does not support compaction`);
      }
    } catch (error) {
      console.warn(`⚠️ Error compacting ${name} database:`, error.message);
      throw error;
    }
  }

  /**
   * Delete documents in batches to avoid overwhelming the database
   */
  async batchDelete(database, docs) {
    const batchSize = 25; // Smaller batches for safety

    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize);

      try {
        await Promise.all(
          batch.map((doc) =>
            database.remove(doc).catch((error) => {
              if (error.status !== 404) {
                // Ignore "not found" errors
                console.warn(`⚠️ Failed to delete document ${doc._id}:`, error.message);
              }
            })
          )
        );
      } catch (batchError) {
        console.warn('⚠️ Batch delete error:', batchError.message);
        // Continue with next batch
      }
    }
  }

  /**
   * Nuclear reset - complete database destruction and recreation
   */
  async nuclearReset() {
    return new Promise((resolve) => {
      Alert.alert(
        '🚨 Nuclear Database Reset',
        'This will completely destroy all local data and start fresh. This action cannot be undone.\n\nAre you absolutely sure?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve({ success: false, message: 'Reset cancelled by user' }),
          },
          {
            text: 'DESTROY ALL DATA',
            style: 'destructive',
            onPress: async () => {
              try {
                const result = await this.performNuclearReset();
                resolve(result);
              } catch (error) {
                resolve({ success: false, message: error.message });
              }
            },
          },
        ],
        { cancelable: false }
      );
    });
  }

  /**
   * Perform the actual nuclear reset
   */
  async performNuclearReset() {
    if (this.operationInProgress) {
      throw new Error('Another emergency operation is in progress');
    }

    this.operationInProgress = true;

    try {
      console.log('💥 NUCLEAR RESET: Starting complete database destruction...');

      // Step 1: Clear AsyncStorage lookup data
      console.log('🗑️ Step 1: Clearing AsyncStorage...');
      await this.clearAsyncStorage();

      // Step 2: Destroy databases
      console.log('💣 Step 2: Destroying databases...');
      await this.destroyDatabases();

      // Step 3: Record the nuclear reset
      await this.recordNuclearReset();

      console.log('✅ NUCLEAR RESET: Complete destruction successful');

      return {
        success: true,
        message: 'Nuclear reset completed successfully. App will restart with fresh data.',
      };
    } catch (error) {
      console.error('❌ NUCLEAR RESET FAILED:', error);
      throw new Error(`Nuclear reset failed: ${error.message}`);
    } finally {
      this.operationInProgress = false;
    }
  }

  /**
   * Clear all AsyncStorage data
   */
  async clearAsyncStorage() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const filteredKeys = keys.filter(
        (key) =>
          !key.startsWith('user_') && // Preserve user authentication data
          !key.startsWith('setting_') // Preserve user settings
      );

      if (filteredKeys.length > 0) {
        await AsyncStorage.multiRemove(filteredKeys);
        console.log(`🗑️ Cleared ${filteredKeys.length} AsyncStorage keys`);
      }
    } catch (error) {
      console.error('❌ Error clearing AsyncStorage:', error);
      throw error;
    }
  }

  /**
   * Destroy both databases completely
   */
  async destroyDatabases() {
    try {
      // Attempt to destroy databases if method exists
      const destroyPromises = [];

      if (typeof LocalGRMDatabase.destroy === 'function') {
        destroyPromises.push(LocalGRMDatabase.destroy());
      } else {
        // Fallback: delete all documents
        destroyPromises.push(this.clearAllDocuments(LocalGRMDatabase, 'GRM'));
      }

      if (typeof LocalDatabase.destroy === 'function') {
        destroyPromises.push(LocalDatabase.destroy());
      } else {
        // Fallback: delete all documents
        destroyPromises.push(this.clearAllDocuments(LocalDatabase, 'EADL'));
      }

      await Promise.all(destroyPromises);
      console.log('💣 Databases destroyed successfully');
    } catch (error) {
      console.error('❌ Error destroying databases:', error);
      throw error;
    }
  }

  /**
   * Clear all documents from a database (fallback method)
   */
  async clearAllDocuments(database, name) {
    try {
      const allDocs = await database.allDocs({ include_docs: true });
      const docs = allDocs.rows.map((row) => row.doc);

      if (docs.length > 0) {
        await this.batchDelete(database, docs);
        console.log(`🗑️ Cleared ${docs.length} documents from ${name}`);
      }
    } catch (error) {
      console.error(`❌ Error clearing ${name} documents:`, error);
      throw error;
    }
  }

  /**
   * Record nuclear reset operation
   */
  async recordNuclearReset() {
    try {
      const resetCount = await this.getNuclearResetCount();
      const newCount = resetCount + 1;

      await AsyncStorage.setItem(STORAGE_KEYS.NUCLEAR_RESET_COUNT, newCount.toString());
      await this.recordEmergencyOperation(OPERATION_TYPES.RESET, 'Nuclear reset completed');

      console.log(`📊 Nuclear reset count: ${newCount}`);
    } catch (error) {
      console.error('❌ Error recording nuclear reset:', error);
      // Don't throw - this is not critical for the reset operation
    }
  }

  /**
   * Record emergency operation
   */
  async recordEmergencyOperation(type, details) {
    try {
      const operation = {
        type,
        details,
        timestamp: new Date().toISOString(),
        healthStatus: this.healthStats.status,
      };

      await AsyncStorage.setItem(STORAGE_KEYS.LAST_EMERGENCY_OPERATION, JSON.stringify(operation));
    } catch (error) {
      console.error('❌ Error recording emergency operation:', error);
    }
  }

  /**
   * Get nuclear reset count
   */
  async getNuclearResetCount() {
    try {
      const count = await AsyncStorage.getItem(STORAGE_KEYS.NUCLEAR_RESET_COUNT);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      console.error('❌ Error getting nuclear reset count:', error);
      return 0;
    }
  }

  /**
   * Get last emergency operation
   */
  async getLastEmergencyOperation() {
    try {
      const operation = await AsyncStorage.getItem(STORAGE_KEYS.LAST_EMERGENCY_OPERATION);
      return operation ? JSON.parse(operation) : null;
    } catch (error) {
      console.error('❌ Error getting last emergency operation:', error);
      return null;
    }
  }

  /**
   * Perform safe operation with automatic cleanup on storage errors
   */
  async safeOperation(operation, description = 'Database operation') {
    try {
      console.log(`🔒 Safe operation: ${description}`);
      return await operation();
    } catch (error) {
      if (this.isCriticalError(error)) {
        console.warn(`⚠️ Critical error during ${description}, attempting emergency cleanup...`);

        try {
          const cleanupResult = await this.emergencyCleanup();
          if (cleanupResult.success) {
            console.log('✅ Emergency cleanup successful, retrying operation...');
            return await operation();
          }
        } catch (cleanupError) {
          console.error('❌ Emergency cleanup failed:', cleanupError);
        }
      }
      throw error;
    }
  }

  /**
   * Get comprehensive system status
   */
  async getSystemStatus() {
    await this.performHealthCheck();

    const [resetCount, lastOperation] = await Promise.all([
      this.getNuclearResetCount(),
      this.getLastEmergencyOperation(),
    ]);

    return {
      health: this.healthStats,
      nuclearResetCount: resetCount,
      lastEmergencyOperation: lastOperation,
      operationInProgress: this.operationInProgress,
      criticalErrorPatterns: CRITICAL_ERROR_PATTERNS.length,
    };
  }
}

// Create singleton instance
const nuclearDataManager = new NuclearDataManager();

export default nuclearDataManager;

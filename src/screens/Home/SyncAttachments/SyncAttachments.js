import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Text, View, StyleSheet } from 'react-native';
import { ActivityIndicator, Snackbar, Card, Divider } from 'react-native-paper';
import { hasUnsyncedChanges } from '@nozbe/watermelondb/sync';
import watermelonManager from '../../../database/watermelonManager';
import { DataContext } from '../../../providers/DataProvider';
import CheckCircle from '../../../../assets/check-circle.svg';
import SyncImage from '../../../../assets/sync-image.svg';
import CustomGreenButton from '../../../components/CustomGreenButton/CustomGreenButton';
import { colors } from '../../../utils/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  divider: {
    marginHorizontal: 20,
    marginVertical: 8,
    backgroundColor: '#e0e0e0',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusContent: {
    flex: 1,
    marginLeft: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  pendingCount: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  lastSyncText: {
    fontSize: 13,
    color: '#999',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModal: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 12,
    minWidth: 280,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  closeButton: {
    minWidth: 120,
  },
  errorSnackbar: {
    backgroundColor: '#f44336',
  },
});

const SYNC_PHASES = {
  idle: 'Ready',
  starting: 'Initializing...',
  pulling: 'Downloading updates...',
  pushing: 'Uploading changes...',
  completed: 'Completed',
  error: 'Failed',
};

const useSyncStatus = (dataManager) => {
  const [state, setState] = useState({
    hasPendingChanges: false,
    isActive: false,
    phase: 'idle',
    lastSync: null,
    pendingCount: 0,
    isLoading: false,
  });

  const updatePendingChanges = useCallback(async () => {
    const database = watermelonManager.getDatabase();
    const hasChanges = await hasUnsyncedChanges({ database });
    const syncStatus = dataManager?.getSyncStatus() || {};

    setState((prev) => ({
      ...prev,
      hasPendingChanges: hasChanges,
      pendingCount: hasChanges ? syncStatus.pendingChangesCount || 0 : 0,
      ...syncStatus,
    }));
  }, [dataManager]);

  useEffect(() => {
    updatePendingChanges();
    const interval = setInterval(updatePendingChanges, 10000);
    return () => clearInterval(interval);
  }, [updatePendingChanges]);

  useEffect(() => {
    if (!dataManager?.syncManager) return undefined;

    const handleSyncStatus = (statusUpdate) => {
      setState((prev) => ({ ...prev, ...statusUpdate }));

      const isInProgress = ['starting', 'pulling', 'pushing'].includes(statusUpdate.phase);
      const isComplete = ['completed', 'error'].includes(statusUpdate.phase);

      setState((prev) => ({ ...prev, isLoading: isInProgress }));

      if (isComplete) updatePendingChanges();
    };

    dataManager.syncManager.addSyncListener(handleSyncStatus);
    return function cleanup() {
      dataManager.syncManager.removeSyncListener(handleSyncStatus);
    };
  }, [dataManager, updatePendingChanges]);

  return { ...state, refreshPendingChanges: updatePendingChanges };
};

const SyncStatusIndicator = ({ hasPendingChanges, pendingCount, isActive, phase }) => {
  const { t } = useTranslation();

  const getStatusColor = () => {
    if (isActive) return colors.primary;
    return hasPendingChanges ? '#ff9800' : '#4caf50';
  };

  const getStatusText = () => {
    if (isActive) return SYNC_PHASES[phase] || phase;
    return hasPendingChanges ? t('Has pending changes') : t('Everything synchronized');
  };

  return (
    <View style={styles.statusRow}>
      <View style={styles.statusIndicator}>
        {isActive ? (
          <ActivityIndicator size="small" color={getStatusColor()} />
        ) : (
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        )}
      </View>

      <View style={styles.statusContent}>
        <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>
        {pendingCount > 0 && (
          <Text style={styles.pendingCount}>
            {pendingCount} {t('pending records')}
          </Text>
        )}
      </View>
    </View>
  );
};

const SyncAttachments = ({ navigation }) => {
  const { t } = useTranslation();
  const { dataManager } = useContext(DataContext);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState(null);

  const syncStatus = useSyncStatus(dataManager);

  const handleSync = async () => {
    if (!dataManager?.syncManager) {
      setError(t('Sync is not available'));
      return;
    }

    try {
      await dataManager.performSync();
      setShowSuccessModal(true);
      syncStatus.refreshPendingChanges();
    } catch (syncError) {
      setError(syncError.message || t('Sync failed'));
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  const getSyncButtonText = () => {
    if (syncStatus.isLoading) return t('Syncing...');
    return syncStatus.hasPendingChanges ? t('Sync Now') : t('Check for Updates');
  };

  const getDescriptionText = () => {
    if (syncStatus.isActive) return t('Synchronization is in progress. Please wait...');

    return syncStatus.hasPendingChanges
      ? t('You have local changes ready to be synchronized.')
      : t('Your data is up to date with the server.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SyncImage width={48} height={48} />
        <View style={styles.headerContent}>
          <Text style={styles.title}>{t('Data Synchronization')}</Text>
          <Text style={styles.description}>{getDescriptionText()}</Text>
        </View>
      </View>

      <Divider style={styles.divider} />

      <SyncStatusIndicator
        hasPendingChanges={syncStatus.hasPendingChanges}
        pendingCount={syncStatus.pendingCount}
        isActive={syncStatus.isActive}
        phase={syncStatus.phase}
      />

      {syncStatus.lastSync && (
        <Text style={styles.lastSyncText}>
          {t('Last sync')}: {new Date(syncStatus.lastSync).toLocaleString()}
        </Text>
      )}

      <View style={styles.buttonContainer}>
        <CustomGreenButton
          title={getSyncButtonText()}
          onPress={handleSync}
          disabled={syncStatus.isLoading}
          loading={syncStatus.isLoading}
        />
      </View>

      <Modal visible={showSuccessModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <Card style={styles.successModal}>
            <CheckCircle width={60} height={60} style={styles.successIcon} />
            <Text style={styles.successTitle}>{t('Sync Successful')}</Text>
            <Text style={styles.successMessage}>
              {t('Your data has been synchronized successfully')}
            </Text>
            <CustomGreenButton
              title={t('Close')}
              onPress={handleCloseSuccess}
              style={styles.closeButton}
            />
          </Card>
        </View>
      </Modal>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={4000}
        style={styles.errorSnackbar}
      >
        {error}
      </Snackbar>
    </View>
  );
};

export default SyncAttachments;

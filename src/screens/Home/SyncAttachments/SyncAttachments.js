import * as FileSystem from 'expo-file-system';
import { getInfoAsync, uploadAsync } from 'expo-file-system';
import React, { useMemo, useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, Text, View, FlatList } from 'react-native';
import { ActivityIndicator, Snackbar, Card, Badge } from 'react-native-paper';
import { useSelector } from 'react-redux';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import watermelonManager from '../../../database/watermelonManager';
import { DataContext } from '../../../providers/DataProvider';
import CheckCircle from '../../../../assets/check-circle.svg';
import SyncImage from '../../../../assets/sync-image.svg';
import CustomGreenButton from '../../../components/CustomGreenButton/CustomGreenButton';
import { colors } from '../../../utils/colors';
import ImagesList from './components/ImagesList';

function SyncAttachments({ navigation, issues = [] }) {
  const { t } = useTranslation();
  const { dataManager } = useContext(DataContext);

  const FILE_READ_ERROR = t('file_read_error');
  const FILE_READ_ERROR_TRY_AGAIN = t('file_read_error_try_again');

  const [loading, setLoading] = useState(true);
  const [pendingIssues, setPendingIssues] = useState([]);
  const [successModal, setSuccessModal] = useState(false);
  const [fetchedContent, setFetchedContent] = useState(false);
  const [errorVisible, setErrorVisible] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState(FILE_READ_ERROR);
  const [syncResults, setSyncResults] = useState({
    created: [],
    updated: [],
    errors: [],
  });

  const onDismissSnackBar = () => setErrorVisible(false);

  const { username, userPassword } = useSelector((state) => state.get('authentication').toObject());

  // Get attachments from issues data
  const attachments = useMemo(() => {
    if (!issues || issues.length === 0) {
      return [];
    }

    return issues.flatMap((issue) => {
      const attachments = issue?.attachments || [];
      const reasons = issue?.reasons || [];

      return [
        ...attachments
          .filter((attachment) => attachment.user_id === username) // Use username instead of representative ID
          .map((attachment) => ({
            attachment,
            docId: issue.id || issue._id,
            tracking_code: issue.tracking_code,
          })),
        ...reasons
          .filter((reason) => reason.user_id === username)
          .map((reason) => ({
            attachment: reason,
            docId: issue.id || issue._id,
            tracking_code: issue.tracking_code,
          })),
      ];
    });
  }, [issues, username]);

  // Load pending issues on mount
  useEffect(() => {
    if (issues.length > 0) {
      loadPendingIssues();
    }
  }, [issues]);

  // Load pending issues from DataManager sync status
  const loadPendingIssues = () => {
    try {
      if (!dataManager) {
        console.warn('[SyncAttachments] DataManager not available');
        return;
      }

      // Get sync status and pending changes from DataManager
      const syncStatus = dataManager.getSyncStatus();

      // For now, create a simple pending issues list based on issues with unsync attachments
      const pendingIssuesList = issues
        .filter((issue) => {
          // Check if issue has unsync attachments
          const hasUnSyncAttachments = (issue.attachments || []).some(
            (attachment) => attachment.uploaded === false && attachment.user_id === username
          );
          return hasUnSyncAttachments;
        })
        .map((issue) => ({
          id: issue.id || issue._id,
          tracking_code: issue.tracking_code || 'Unknown',
          status: 'pending',
          action: 'sync_attachments',
          project: issue.project_id || null,
          error: null,
        }));

      setPendingIssues(pendingIssuesList);
      console.log('[SyncAttachments] Loaded pending issues:', pendingIssuesList.length);
    } catch (error) {
      console.error('[SyncAttachments] Error loading pending issues:', error);
    }
  };

  const uploadFile = async (file, dbConfig) => {
    try {
      const tmp = await getInfoAsync(file?.attachment?.local_url);
      if (tmp.exists) {
        try {
          console.log('[SyncAttachments] Preparing to upload file:', file?.attachment?.local_url);

          // Prepare file data for Frappe upload
          const fileData = {
            filename: file.attachment.filename || file.attachment.id,
            content_type: file.attachment.isAudio
              ? 'audio/m4a'
              : file.attachment.local_url.includes('.pdf')
              ? 'application/pdf'
              : 'image/jpeg',
            file_data: await FileSystem.readAsStringAsync(
              Platform.OS === 'android'
                ? file.attachment.local_url
                : file.attachment.local_url.replace('file://', ''),
              { encoding: FileSystem.EncodingType.Base64 }
            ),
          };

          // Use DataManager to upload the attachment
          const result = await dataManager.uploadAttachment(file.docId, fileData);

          console.log('[SyncAttachments] File uploaded successfully:', result);
          return {};
        } catch (e) {
          setErrorMessage(FILE_READ_ERROR);
          setErrorVisible(true);
          console.log('[SyncAttachments] Error uploading file:', e.message);
          return { error: FILE_READ_ERROR };
        }
      }
      setErrorMessage(FILE_READ_ERROR);
      setErrorVisible(true);
      console.log('[SyncAttachments] File does not exist:', file?.attachment?.local_url);
      return { error: FILE_READ_ERROR };
    } catch (e) {
      console.log('[SyncAttachments] Error reading file:', e.message);
      setErrorMessage(FILE_READ_ERROR_TRY_AGAIN);
      setErrorVisible(true);
      return { error: FILE_READ_ERROR_TRY_AGAIN };
    }
  };

  const syncImages = async () => {
    let isError = false;
    let syncedCount = 0;

    try {
      setLoading(true);
      console.log(
        '[SyncAttachments] Starting attachment sync. Total attachments:',
        attachments.length
      );

      for (let i = 0; i < attachments.length; i++) {
        if (attachments[i]?.attachment?.uploaded === false) {
          console.log(
            `[SyncAttachments] Uploading attachment ${i + 1}/${attachments.length}:`,
            attachments[i].attachment.filename
          );

          const result = await uploadFile(attachments[i]);

          if (result.error) {
            isError = true;
            console.log(`[SyncAttachments] Failed to upload attachment ${i + 1}: ${result.error}`);
          } else {
            syncedCount++;
            console.log(`[SyncAttachments] Attachment uploaded successfully.`);
          }
        }
      }

      // Then perform a full sync to ensure all changes are pushed to Frappe
      // and ensure issues have project assignments from user's assigned projects
      try {
        console.log('[SyncAttachments] Performing data sync...');
        await dataManager.performSync();
        console.log('[SyncAttachments] Sync completed successfully');

        // Update our local state with the results
        setSyncResults({
          created: [],
          updated: [],
          errors: [],
        });

        // Update pending issues based on sync results
        updatePendingIssuesFromSyncResults([], [], []);

        // Show success modal
        setSuccessModal(true);
      } catch (syncError) {
        console.error('[SyncAttachments] Sync error:', syncError);
        setErrorMessage(syncError.message || 'Sync failed');
        setErrorVisible(true);
        isError = true;
      }

      setLoading(false);

      if (isError) {
        console.log('[SyncAttachments] Sync completed with errors');
      } else {
        console.log(
          `[SyncAttachments] Sync completed successfully. Uploaded ${syncedCount} attachments`
        );
      }
    } catch (error) {
      setLoading(false);
      console.error('[SyncAttachments] Error during sync:', error);
      setErrorMessage(error.message || 'An error occurred during sync');
      setErrorVisible(true);
    }
  };

  const updatePendingIssuesFromSyncResults = (created, updated, errors) => {
    try {
      // Clear pending issues on successful sync
      if (errors.length === 0) {
        setPendingIssues([]);
      } else {
        // Update pending issues with error information
        setPendingIssues((current) =>
          current.map((issue) => {
            const error = errors.find((err) => err.id === issue.id);
            return error ? { ...issue, error: error.error } : issue;
          })
        );
      }
    } catch (error) {
      console.error('[SyncAttachments] Error updating pending issues:', error);
    }
  };

  const renderPendingIssueItem = ({ item }) => (
    <Card style={{ margin: 8, padding: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: 'bold' }}>{item.tracking_code}</Text>
          <Text style={{ color: '#666', fontSize: 12 }}>Action: {item.action}</Text>
          {item.project && (
            <Text style={{ color: '#666', fontSize: 12 }}>Project: {item.project}</Text>
          )}
          {item.error && <Text style={{ color: 'red', fontSize: 12 }}>Error: {item.error}</Text>}
        </View>
        <Badge style={{ backgroundColor: item.error ? '#f44336' : '#ff9800' }}>{item.status}</Badge>
      </View>
    </Card>
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Main Content */}
      <View style={{ flex: 1, padding: 16 }}>
        {/* Sync Status */}
        <Card style={{ marginBottom: 16, padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
            {t('sync_status', 'Sync Status')}
          </Text>
          <Text>
            {t('pending_attachments', 'Pending Attachments')}:{' '}
            {attachments.filter((a) => !a.attachment.uploaded).length}
          </Text>
          <Text>
            {t('pending_issues', 'Pending Issues')}: {pendingIssues.length}
          </Text>
        </Card>

        {/* Attachments List */}
        {attachments.length > 0 && (
          <Card style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', padding: 16 }}>
              {t('attachments_to_sync', 'Attachments to Sync')}
            </Text>
            <ImagesList attachments={attachments.filter((a) => !a.attachment.uploaded)} />
          </Card>
        )}

        {/* Pending Issues List */}
        {pendingIssues.length > 0 && (
          <Card style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', padding: 16 }}>
              {t('pending_issues', 'Pending Issues')}
            </Text>
            <FlatList
              data={pendingIssues}
              renderItem={renderPendingIssueItem}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 300 }}
            />
          </Card>
        )}

        {/* No Data Message */}
        {!loading && attachments.length === 0 && pendingIssues.length === 0 && (
          <Card style={{ padding: 20, alignItems: 'center' }}>
            <SyncImage width={80} height={80} style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 16, textAlign: 'center', color: '#666' }}>
              {t('no_items_to_sync', 'No items to sync')}
            </Text>
          </Card>
        )}
      </View>

      {/* Sync Button */}
      {(attachments.some((a) => !a.attachment.uploaded) || pendingIssues.length > 0) && (
        <View style={{ padding: 16 }}>
          <CustomGreenButton
            title={loading ? t('syncing', 'Syncing...') : t('sync_now', 'Sync Now')}
            onPress={syncImages}
            disabled={loading}
            loading={loading}
          />
        </View>
      )}

      {/* Success Modal */}
      <Modal visible={successModal} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Card
            style={{
              margin: 20,
              padding: 20,
              backgroundColor: 'white',
              alignItems: 'center',
              minWidth: 300,
            }}
          >
            <CheckCircle width={60} height={60} style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
              {t('sync_successful', 'Sync Successful')}
            </Text>
            <Text style={{ textAlign: 'center', marginBottom: 16, color: '#666' }}>
              {t('all_data_synced', 'All data has been synchronized successfully')}
            </Text>
            <CustomGreenButton
              title={t('close', 'Close')}
              onPress={() => {
                setSuccessModal(false);
                navigation.goBack();
              }}
              style={{ minWidth: 120 }}
            />
          </Card>
        </View>
      </Modal>

      {/* Error Snackbar */}
      <Snackbar
        visible={errorVisible}
        onDismiss={onDismissSnackBar}
        duration={5000}
        style={{ backgroundColor: '#f44336' }}
      >
        {errorMessage}
      </Snackbar>

      {/* Loading Overlay */}
      {loading && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Card style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 12, fontSize: 16 }}>
              {t('syncing_data', 'Syncing data...')}
            </Text>
          </Card>
        </View>
      )}
    </View>
  );
}

// Enhanced component with observables
const SyncAttachmentsWithObservables = withObservables([], () => ({
  issues: watermelonManager.observeIssues(),
}))(SyncAttachments);

export default SyncAttachmentsWithObservables;

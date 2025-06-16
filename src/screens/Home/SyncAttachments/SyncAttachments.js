import * as FileSystem from 'expo-file-system';
import { getInfoAsync, uploadAsync } from 'expo-file-system';
import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, Text, View, FlatList } from 'react-native';
import { ActivityIndicator, Snackbar, Card, Badge } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useView } from 'use-pouchdb';
import CheckCircle from '../../../../assets/check-circle.svg';
import SyncImage from '../../../../assets/sync-image.svg';
import CustomGreenButton from '../../../components/CustomGreenButton/CustomGreenButton';
import { baseURL } from '../../../services/API';
import { colors } from '../../../utils/colors';
import { SyncToRemoteDatabase } from '../../../utils/databaseManager';
import { getEncryptedData } from '../../../utils/storageManager';
import ImagesList from './components/ImagesList';
import dataManager from '../../../services/DataManager';
import frappeSyncManager from '../../../services/FrappeSyncManager';

function SyncAttachments({ navigation }) {
  const { t } = useTranslation();

  const FILE_READ_ERROR = t('file_read_error');
  const FILE_READ_ERROR_TRY_AGAIN = t('file_read_error_try_again');

  const [loading, setLoading] = useState(false);
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

  const { rows: representative, loading: eadlLoading } = useView('eadl/by_representative_email', {
    key: username,
    include_docs: true,
    db: 'LocalCommunesDatabase',
  });

  const eadl = useMemo(() => representative.map((d) => d.doc), [representative]);

  const { rows: grmIssues, loading: issuesLoading } = useView(
    'issues/by_type_and_user',
    {
      startkey: ['issue', eadl?.[0]?._id],
      endkey: ['issue', eadl?.[0]?._id, {}],
      include_docs: true,
      db: 'LocalGRMDatabase',
    },
    [eadl?.[0]?._id]
  );

  const issues = useMemo(() => grmIssues.map((r) => r.doc), [grmIssues]);

  const attachments = useMemo(() => {
    if (!eadlLoading && !issuesLoading && issues.length > 0 && eadl?.[0]?.representative?.id) {
      return issues.flatMap((issue) => {
        const attachments = issue?.attachments || [];
        const reasons = issue?.reasons || [];

        return [
          ...attachments
            .filter((attachment) => attachment.user_id === eadl[0].representative.id)
            .map((attachment) => ({
              attachment,
              docId: issue._id,
              tracking_code: issue.tracking_code,
            })),
          ...reasons
            .filter((reason) => reason.user_id === eadl[0].representative.id)
            .map((reason) => ({
              attachment: reason,
              docId: issue._id,
              tracking_code: issue.tracking_code,
            })),
        ];
      });
    }
    return [];
  }, [issues, eadl, eadlLoading, issuesLoading]);

  // Load pending issues on mount
  useEffect(() => {
    if (!eadlLoading && !issuesLoading) {
      loadPendingIssues();
    }
  }, [issues, eadlLoading, issuesLoading]);

  // Load pending issues from frappeSyncManager
  const loadPendingIssues = () => {
    // Extract pending issues from frappeSyncManager
    const pendingChanges = frappeSyncManager.pendingChanges || [];
    const pendingIssueChanges = pendingChanges.filter((change) => change.type === 'issue');

    // Map to a more user-friendly format
    const pendingIssuesList = pendingIssueChanges.map((change) => {
      // Find the corresponding issue in our loaded issues
      const matchingIssue = issues.find(
        (issue) =>
          issue._id === change.data._id ||
          issue._id === change.data.docId ||
          (change.local_id && issue._id.includes(change.local_id))
      );

      return {
        id: change.local_id || change.data._id || change.data.docId,
        tracking_code: matchingIssue?.tracking_code || 'Unknown',
        status: 'pending',
        action: change.action,
        project: matchingIssue?.project || null,
        error: null,
      };
    });

    setPendingIssues(pendingIssuesList);
    console.log('[SyncAttachments] Loaded pending issues:', pendingIssuesList.length);
  };

  // Log actual pending changes on mount
  useEffect(() => {
    console.log(
      '[SyncAttachments] Actual pending changes in FrappeSyncManager:',
      JSON.stringify(frappeSyncManager.pendingChanges, null, 2)
    );
  }, []);

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

          // Use frappeSyncManager to upload the attachment
          const result = await frappeSyncManager.uploadAttachment(file.docId, fileData);

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
    // Log pending changes before sync
    console.log(
      '[SyncAttachments] Pending changes before syncImages:',
      JSON.stringify(frappeSyncManager.pendingChanges, null, 2)
    );

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
            attachments[i]
          );
          const response = await uploadFile(attachments[i]);
          if (response.error) {
            isError = true;
            console.log(`[SyncAttachments] Error uploading attachment:`, response.error);
          } else {
            syncedCount++;
            console.log(`[SyncAttachments] Attachment uploaded successfully.`);
          }
        }
      }

      // Then perform a full sync to ensure all changes are pushed to Frappe
      // and ensure issues have project assignments from user's assigned projects
      const syncResponse = await frappeSyncManager.pushPendingChanges();
      console.log('[SyncAttachments] Sync response:', syncResponse);

      // Process the sync response
      if (syncResponse && syncResponse.data) {
        const { created = [], updated = [], errors = [] } = syncResponse.data;

        // Update our local state with the results
        setSyncResults({
          created,
          updated,
          errors,
        });

        // Update pending issues based on sync results
        updatePendingIssuesFromSyncResults(created, updated, errors);

        // Only show success if there were no errors
        if (errors.length === 0) {
          setSuccessModal(true);
        } else {
          // Show error message for the first error
          if (errors.length > 0) {
            const firstError = errors[0];
            let errorMsg = firstError.error;

            // Handle specific error cases
            if (errorMsg.includes('Status None does not belong to project None')) {
              errorMsg = t('error_status_project_none');
              if (!errorMsg || errorMsg === 'error_status_project_none') {
                errorMsg = 'Status does not belong to project. Please try again.';
              }
            }

            setErrorMessage(errorMsg);
            setErrorVisible(true);
            isError = true;
          }
        }
      } else if (syncResponse && syncResponse.status === 'success') {
        // If we got a success response but no data, still consider it successful
        console.log('[SyncAttachments] All pending changes synced successfully.');
        if (!isError) setSuccessModal(true);
      } else {
        // If we didn't get a proper response, show a generic error
        setErrorMessage('Sync failed with unknown error');
        setErrorVisible(true);
        isError = true;
      }

      // Reload pending issues after sync to reflect current state
      loadPendingIssues();
    } catch (err) {
      console.log('[SyncAttachments] Error during sync process:', err.message);
      setErrorMessage(err.message || 'Sync failed');
      setErrorVisible(true);
      isError = true;
    } finally {
      setLoading(false);
      console.log(
        `[SyncAttachments] Attachment sync complete. Synced: ${syncedCount}, Errors: ${isError}`
      );
    }
  };

  // Update pending issues based on sync results
  const updatePendingIssuesFromSyncResults = (created, updated, errors) => {
    // Create a map of local_id to error for quick lookup
    const errorMap = {};
    errors.forEach((error) => {
      if (error.local_id && error.type === 'issue') {
        errorMap[error.local_id] = error.error;
      }
    });

    // Create sets of successfully synced local_ids
    const successfulLocalIds = new Set([
      ...created.filter((item) => item.type === 'issue').map((item) => item.local_id),
      ...updated.filter((item) => item.type === 'issue').map((item) => item.id),
    ]);

    // Update pending issues
    setPendingIssues((prevIssues) => {
      return prevIssues
        .map((issue) => {
          // If the issue has an error
          if (errorMap[issue.id]) {
            return {
              ...issue,
              status: 'error',
              error: errorMap[issue.id],
            };
          }
          // If the issue was successfully synced
          else if (successfulLocalIds.has(issue.id)) {
            return {
              ...issue,
              status: 'synced',
            };
          }
          // Otherwise keep as is
          return issue;
        })
        .filter((issue) => issue.status !== 'synced'); // Remove synced issues
    });
  };

  // Render a pending issue item
  const renderPendingIssueItem = ({ item }) => (
    <Card
      style={{
        marginVertical: 5,
        marginHorizontal: 10,
        backgroundColor: item.status === 'error' ? '#fff0f0' : '#ffffff',
      }}
    >
      <Card.Content>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Text style={{ fontWeight: 'bold' }}>
            {t('reference')}: {item.tracking_code}
          </Text>
          <Badge
            style={{
              backgroundColor:
                item.status === 'error'
                  ? '#ff6b6b'
                  : item.status === 'synced'
                  ? '#4caf50'
                  : '#ffc107',
            }}
          >
            {item.status === 'error'
              ? t('error')
              : item.status === 'synced'
              ? t('synced')
              : t('pending')}
          </Badge>
        </View>
        <Text style={{ marginTop: 5 }}>
          {item.action === 'create' ? t('new_issue') : t('update_issue')}
        </Text>
        {item.status === 'error' && (
          <Text style={{ color: '#d32f2f', marginTop: 5 }}>{item.error}</Text>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={{ flex: 1 }}>
      <Modal animationType="slide" style={{ flex: 1 }} visible={successModal}>
        <View
          style={{
            flex: 1,
            padding: 20,
            alignItems: 'center',
            justifyContent: 'space-around',
          }}
        >
          <View style={{ alignItems: 'center', marginTop: '20%' }}>
            <CheckCircle />
            <Text
              style={{
                marginVertical: 25,
                fontFamily: 'Poppins_700Bold',
                fontSize: 20,
                fontWeight: 'bold',
                fontStyle: 'normal',
                lineHeight: 25,
                letterSpacing: 0,
                textAlign: 'center',
                color: '#707070',
              }}
            >
              Synchronisation {'\n'} Réussie!
            </Text>
          </View>
          <SyncImage />
          <CustomGreenButton
            onPress={() => navigation.goBack()}
            buttonStyle={{
              width: '100%',
              height: 36,
              borderRadius: 7,
            }}
            textStyle={{
              fontFamily: 'Poppins_500Medium',
              fontSize: 14,
              lineHeight: 21,
              letterSpacing: 0,
              textAlign: 'right',
              color: '#ffffff',
            }}
          >
            {t('close')}
          </CustomGreenButton>
        </View>
      </Modal>

      {/* Pending Issues Section */}
      {pendingIssues.length > 0 && (
        <View style={{ marginVertical: 10 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginLeft: 10, marginBottom: 5 }}>
            {t('pending_issues')} ({pendingIssues.length})
          </Text>
          <FlatList
            data={pendingIssues}
            renderItem={renderPendingIssueItem}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 200 }}
          />
        </View>
      )}

      {/* Attachments Section */}
      <ImagesList attachments={attachments} />

      {loading || eadlLoading || issuesLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 10 }} />
      ) : (
        <View>
          <CustomGreenButton
            onPress={syncImages}
            buttonStyle={{
              height: 36,
              borderRadius: 7,
              marginHorizontal: '5%',
              width: '90%',
              marginBottom: 10,
            }}
            textStyle={{
              fontFamily: 'Poppins_500Medium',
              fontSize: 14,
              lineHeight: 21,
              letterSpacing: 0,
              textAlign: 'right',
              color: '#ffffff',
            }}
          >
            {t('synchronize')}
          </CustomGreenButton>
        </View>
      )}
      <Snackbar visible={errorVisible} duration={3000} onDismiss={onDismissSnackBar}>
        {errorMessage}
      </Snackbar>
    </View>
  );
}

export default SyncAttachments;

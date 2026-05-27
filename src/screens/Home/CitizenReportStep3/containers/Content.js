/* eslint-disable no-use-before-define */
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState, useMemo, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet as RNStyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { withObservables } from '@nozbe/watermelondb/react';
import { AuthContext } from '../../../../providers/AuthProvider';
import dayjs from '../../../../utils/dayjs';
import watermelonManager from '../../../../database/watermelonManager';
import dataManager from '../../../../services/DataManager'; // Import DataManager for proper API sync
import { AttachmentList } from '../../../../components/AttachmentList/AttachmentList';
import { colors } from '../../../../utils/colors';
import { logger } from '../../../../utils/logger';
import { styles } from './Content.styles';
import { createLookupMap } from '../../../../utils/issueDetailUtils';
import { generateTrackingCode } from '../../../../utils/trackingCodeGenerator';

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: '#dedede',
    text: '#707070',
  },
};

const Content = ({
  stepOneParams,
  stepTwoParams,
  stepLocationParams,
  statuses = [], // From withObservables - needed for initial status lookup
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { credentials } = useContext(AuthContext);
  const [showDialog, setShowDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImageUri, setModalImageUri] = useState(null);

  const _hideDialog = () => setShowDialog(false);
  const _showDialog = () => setShowDialog(true);

  // Create status lookup map using shared utility for performance
  const statusMap = useMemo(() => createLookupMap(statuses, 'status_name'), [statuses]);

  // Debug logging for status processing
  useEffect(() => {
    console.log('🔍 [STEP3] Status data info:', {
      statusesCount: statuses.length,
      statusMapSize: statusMap.size,
    });
    if (statusMap.size > 0) {
      console.log('🔍 [STEP3] Status map sample:', Array.from(statusMap.entries()).slice(0, 3));
    }
  }, [statuses, statusMap]);

  /**
   * Determine if the current user should be assigned to the issue
   * based on their region assignments and the category's assigned department
   */
  const determineIssueAssignment = () => {
    try {
      // Get user context from DataManager
      const userContext = dataManager.getUserContext();

      if (!userContext) {
        console.log('🔍 [ASSIGNMENT] No user context available');
        return {
          shouldAssign: false,
          assigneeId: null,
          reason: 'No user context available',
        };
      }

      // Get selected region ID
      const selectedRegionId = stepLocationParams.administrative_region;

      if (!selectedRegionId) {
        console.log('🔍 [ASSIGNMENT] No administrative region selected');
        return {
          shouldAssign: false,
          assigneeId: null,
          reason: 'No administrative region selected',
        };
      }

      // Check if user has access to the selected region
      const hasRegionAccess = dataManager.hasRegionAccess(selectedRegionId);

      if (!hasRegionAccess) {
        console.log(
          '🔍 [ASSIGNMENT] User does not have access to administrative region:',
          selectedRegionId
        );
        return {
          shouldAssign: false,
          assigneeId: null,
          reason: `User does not have access to administrative region: ${selectedRegionId}`,
        };
      }

      // Get user assignment for this region
      const regionAssignment = dataManager.getUserAssignmentForRegion(selectedRegionId);

      if (!regionAssignment) {
        console.log(
          '🔍 [ASSIGNMENT] No user assignment found for administrative region:',
          selectedRegionId
        );
        return {
          shouldAssign: false,
          assigneeId: null,
          reason: `No user assignment found for administrative region: ${selectedRegionId}`,
        };
      }

      // Check if category matches user's department in the region
      const categoryDepartment =
        stepTwoParams.category?.assigned_department ||
        stepTwoParams.category?.assigned_department_id;
      const userDepartment = regionAssignment.department?.id || regionAssignment.department?.name;

      if (!categoryDepartment) {
        console.log('🔍 [ASSIGNMENT] Category has no assigned department');
        console.log(
          '🔍 [ASSIGNMENT] Available category fields:',
          Object.keys(stepTwoParams.category || {})
        );
        console.log('🔍 [ASSIGNMENT] Category object:', stepTwoParams.category);
        return {
          shouldAssign: false,
          assigneeId: null,
          reason: 'Category has no assigned department',
        };
      }

      if (!userDepartment) {
        console.log('🔍 [ASSIGNMENT] User has no department in region assignment');
        return {
          shouldAssign: false,
          assigneeId: null,
          reason: 'User has no department in region assignment',
        };
      }

      const isDepartmentMatch = categoryDepartment === userDepartment;

      // Additional check for administrative level if available
      const categoryAdminLevel =
        stepTwoParams.category?.administrative_level ||
        stepTwoParams.category?.administrative_level_id;
      const userAdminLevel = regionAssignment.administrative_level;

      let isAdminLevelMatch = true; // Default to true if no admin level specified
      if (categoryAdminLevel && userAdminLevel) {
        isAdminLevelMatch = categoryAdminLevel === userAdminLevel;
      }

      const shouldAssign = isDepartmentMatch && isAdminLevelMatch;
      const assigneeId = shouldAssign ? userContext.user?.id : null;

      console.log('🔍 [ASSIGNMENT] Assignment determination:', {
        selectedRegion: {
          id: selectedRegionId,
          name: stepLocationParams.issueLocation?.name,
        },
        hasRegionAccess,
        regionAssignment: {
          region: regionAssignment.region?.id || regionAssignment.region?.name,
          department: userDepartment,
          role: regionAssignment.role,
          adminLevel: userAdminLevel,
        },
        category: {
          id: stepTwoParams.category?.id,
          name: stepTwoParams.category?.categoryName,
          assignedDepartment: categoryDepartment,
          adminLevel: categoryAdminLevel,
        },
        checks: {
          isDepartmentMatch,
          isAdminLevelMatch,
        },
        result: {
          shouldAssign,
          assigneeId,
          reason: shouldAssign
            ? `Assigned to user - department and admin level match`
            : `Not assigned - department match: ${isDepartmentMatch}, admin level match: ${isAdminLevelMatch}`,
        },
      });

      return {
        shouldAssign,
        assigneeId,
        reason: shouldAssign
          ? `Assigned to user - department and admin level match`
          : `Not assigned - department match: ${isDepartmentMatch}, admin level match: ${isAdminLevelMatch}`,
      };
    } catch (error) {
      console.error('❌ [ASSIGNMENT] Error determining assignment:', error);
      return {
        shouldAssign: false,
        assigneeId: null,
        reason: `Error determining assignment: ${error.message}`,
      };
    }
  };

  const submitIssue = async () => {
    setIsSubmitting(true);

    logger.userAction('issue_submission_start', 'CitizenReportStep3', {
      projectId: stepOneParams.selectedProject?.id,
      categoryId: stepTwoParams.category?.id,
      issueTypeId: stepTwoParams.issueType?.id,
      hasAttachments: !!(stepTwoParams.attachments?.length || stepTwoParams.recordings?.length),
      administrativeRegion: stepLocationParams.administrative_region,
    });

    try {
      // ✅ Get user context for both assignment and reporter ID
      const userContext = dataManager.getUserContext();
      const currentUsername = userContext?.user?.id || credentials?.username;
      console.log(
        '🔍 [STEP3] User context for issue creation:',
        userContext,
        'fallback username:',
        currentUsername
      );

      // Get the initial status from available statuses using shared utility processing
      const initialStatus = statuses.find((status) => {
        const statusData = status._raw || status;
        return statusData.initial_status === true;
      });

      if (!initialStatus) {
        console.error('❌ [STEP3] No initial status found in statuses:', statuses);
        throw new Error('No initial status available. Please contact support.');
      }

      const initialStatusId = initialStatus._raw?.id || initialStatus.id;
      const initialStatusName =
        statusMap.get(initialStatusId) ||
        initialStatus._raw?.status_name ||
        initialStatus.status_name;
      console.log('🔍 [STEP3] Using initial status:', {
        id: initialStatusId,
        name: initialStatusName,
      });

      // Determine assignment based on user context and region/department rules
      const assignmentResult = determineIssueAssignment();
      console.log('🔍 [STEP3] Assignment result:', assignmentResult);

      // Prepare issue data for creation
      const issueData = {
        // Basic issue information
        issue_type: stepTwoParams.issueType?.id,
        category: stepTwoParams.category?.id,
        description: stepTwoParams.additionalDetails,

        // Date information - ensure proper format
        issue_date: stepTwoParams.date ? new Date(stepTwoParams.date).getTime() : Date.now(),
        intake_date: Date.now(),

        // ✅ FIXED: Set administrative_region properly from location params
        administrative_region: stepLocationParams.administrative_region,

        // Contact information
        contact_medium: stepOneParams.methodOfContact || stepOneParams.contact_medium,
        contact_info_type: stepOneParams.contactType || stepOneParams.contact_info_type,
        contact_information: stepOneParams.contactInfo || stepOneParams.contact_information,

        // Citizen information - using correct field names from model
        citizen: stepOneParams.citizen,
        citizen_type: stepOneParams.citizen_type,
        gender: stepOneParams.gender,
        citizen_age_group: stepOneParams.citizen_age_group,
        citizen_group_1: stepOneParams.citizen_group_1,
        citizen_group_2: stepOneParams.citizen_group_2,

        // Generate tracking code using simple format: {PROJECT_CODE}-{YYMMDD}-{RRRR}
        tracking_code: generateTrackingCode(
          stepOneParams.selectedProject?.id,
          stepTwoParams.date ? new Date(stepTwoParams.date) : new Date()
        ),

        // Set confirmed flag
        confirmed: true,

        status: initialStatusId,

        reporter: currentUsername,

        // Set project if available
        project: stepLocationParams.projectId || stepOneParams.selectedProject?.id || '',

        assignee: assignmentResult.assigneeId || currentUsername,
      };

      console.log('🔍 [STEP3] Prepared issue data for DataManager:', {
        ...issueData,
        administrative_region: issueData.administrative_region, // Explicitly log this field
        regionMetadata: stepLocationParams.regionMetadata, // Log metadata for verification
      });
      console.log('🔍 [STEP3] Assignment info:', {
        willAssign: assignmentResult.shouldAssign,
        assigneeId: assignmentResult.assigneeId,
        reason: assignmentResult.reason,
      });
      console.log(
        '🔍 [STEP3] Date formats - issue_date:',
        issueData.issue_date,
        'intake_date:',
        issueData.intake_date
      );

      // ✅ USE DataManager instead of watermelonManager directly
      // This ensures proper API sync when online and local storage when offline
      const newIssue = await dataManager.createIssue(issueData);

      logger.info('Issue created successfully', {
        issueId: newIssue.id,
        trackingCode: newIssue.tracking_code || newIssue.trackingCode,
        categoryId: stepTwoParams.category?.id,
        issueTypeId: stepTwoParams.issueType?.id,
        hasAssignee: !!assignmentResult.assigneeId,
        administrativeRegion: stepLocationParams.administrative_region,
      });

      // Verify the issue was actually saved by trying to fetch it from local database
      console.log('🔍 [STEP3] Verifying issue was saved locally...');
      try {
        const savedIssue = await watermelonManager.getIssue(newIssue.id);
        if (savedIssue) {
          console.log('✅ [STEP3] Issue verification successful - issue found in local database');
          console.log('✅ [STEP3] Saved issue details:', savedIssue);
        } else {
          console.error('❌ [STEP3] Issue verification failed - issue not found in local database');
          throw new Error('Issue was not properly saved to local database');
        }
      } catch (verifyError) {
        console.error('❌ [STEP3] Error verifying saved issue:', verifyError);
        throw new Error(`Failed to verify issue was saved: ${verifyError.message}`);
      }

      // 1. After creating the issue, batch create grm_issue_attachments for all attachments and recordings
      // 2. Use WatermelonDB database.write and collection.create for each attachment
      // 3. Link each attachment to the new issue via grm_issue field
      // 4. Add error handling for attachment saving
      const issueId = newIssue.id;
      const trackingCode = newIssue.tracking_code || newIssue.trackingCode;

      console.log(
        '🔍 [STEP3] Navigating to Step 4 with issue ID:',
        issueId,
        'tracking code:',
        trackingCode
      );

      // Batch create attachments
      const attachmentsToCreate = [];
      if (stepTwoParams.attachments && stepTwoParams.attachments.length > 0) {
        for (const attachment of stepTwoParams.attachments) {
          attachmentsToCreate.push({
            issue: issueId,
            attachment_url: attachment.local_url, // Use local_url from Step 2
            attachment_name: attachment.fileName, // Use fileName from Step 2
            created_at: Date.now(),
          });
        }
      }

      if (stepTwoParams.recordings && stepTwoParams.recordings.length > 0) {
        for (const recording of stepTwoParams.recordings) {
          attachmentsToCreate.push({
            issue: issueId,
            attachment_url: recording.local_url, // Use local_url from Step 2
            attachment_name: recording.fileName, // Use fileName from Step 2
            created_at: Date.now(),
          });
        }
      }

      if (attachmentsToCreate.length > 0) {
        console.log('🔍 [STEP3] Batch creating attachments...');
        try {
          await watermelonManager.createIssueAttachments(attachmentsToCreate);
          console.log('✅ [STEP3] All attachments created successfully.');
        } catch (attachmentError) {
          console.error('❌ [STEP3] Error creating attachments:', attachmentError);
          Alert.alert(t('error'), t('attachment_creation_error'), [
            { text: t('ok'), style: 'default' },
          ]);
        }
      } else {
        console.log('🔍 [STEP3] No attachments to create.');
      }

      navigation.navigate('CitizenReportStep4', {
        issueId,
        trackingCode,
      });
    } catch (error) {
      logger.error('Issue creation failed', error, {
        projectId: stepOneParams.selectedProject?.id,
        categoryId: stepTwoParams.category?.id,
        issueTypeId: stepTwoParams.issueType?.id,
        administrativeRegion: stepLocationParams.administrative_region,
      });
      Alert.alert(t('error'), t('issue_creation_error'), [{ text: t('ok'), style: 'default' }], {
        cancelable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    // Check if category requires confirmation dialog using the data as it comes from step 2
    if (stepTwoParams.category && stepTwoParams.category.confidentiality_level === 'Confidential') {
      _showDialog();
    } else {
      submitIssue();
    }
  };

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('Sorry, we need camera roll permissions to make this work!'));
        }
      }
    })();
  }, []);

  return (
    <ScrollView>
      <View style={{ padding: 23 }}>
        <Text style={styles.stepText}>{t('step_5')}</Text>
        <Text style={styles.stepSubtitle}>{t('step_3_confirmation')}</Text>
        <Text style={styles.stepDescription}>{t('step_3_subtitle')}</Text>
      </View>

      {/* STEP 3 SUMMARY - Using data as it comes from previous steps */}
      <View style={styles.cardConfirm}>
        <View>
          <Text style={styles.stepSubtitle}>{t('step_3_field_title_1')}</Text>
          <Text style={styles.stepDescription}>
            {stepTwoParams.date && stepTwoParams.date !== 'null'
              ? dayjs(stepTwoParams.date).format('DD-MMMM-YYYY')
              : '--'}
          </Text>
        </View>

        <View>
          <Text style={styles.stepSubtitle}>{t('step_3_field_title_2')}</Text>
          <Text style={styles.stepDescription}>{stepTwoParams.issueType?.typeName || '--'}</Text>
        </View>

        {/* <View>
          <Text style={styles.stepSubtitle}>{t('step_3_field_title_2_1')}</Text>
          <Text style={styles.stepDescription}>{stepTwoParams.issueSubType?.name || '--'}</Text>
        </View> */}

        <View>
          <Text style={styles.stepSubtitle}>{t('step_3_field_title_3')}</Text>
          <Text style={styles.stepDescription}>{stepTwoParams.category?.categoryName || '--'}</Text>
        </View>

        {/* <View>
          <Text style={styles.stepSubtitle}>{t('step_3_field_title_5')}</Text>
          <Text style={styles.stepDescription}>{stepTwoParams.issueComponent?.name || '--'}</Text>
        </View> */}

        {/* <View>
          <Text style={styles.stepSubtitle}>{t('step_3_field_title_6')}</Text>
          <Text style={styles.stepDescription}>
            {stepTwoParams.issueSubComponent?.name || '--'}
          </Text>
        </View> */}

        <View>
          <Text style={styles.stepSubtitle}>{t('step_3_field_title_4')}</Text>
          <Text style={styles.stepDescription}>{stepTwoParams.additionalDetails || '--'}</Text>
        </View>

        <Text style={styles.stepSubtitle}>{t('step_3_attachments')}</Text>

        {/* Combined Attachment List */}
        <AttachmentList
          attachments={[...(stepTwoParams.attachments || []), ...(stepTwoParams.recordings || [])]}
          showTypeHeaders
          showRemoveButton={false}
          onImagePress={(item) => {
            setModalImageUri(item.local_url);
            setModalVisible(true);
          }}
          style={{ marginVertical: 10 }}
        />
      </View>

      <View style={{ paddingHorizontal: 50 }}>
        <Button
          theme={theme}
          style={{ alignSelf: 'center', margin: 24 }}
          labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
          mode="contained"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {t('submit_button_text')}
        </Button>
      </View>

      <Modal
        visible={showDialog}
        transparent
        animationType="fade"
        onRequestClose={_hideDialog}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={_hideDialog}>
          <View style={dialogStyles.backdrop}>
            <TouchableWithoutFeedback>
              <View style={dialogStyles.card}>
                <View style={dialogStyles.header}>
                  <Text style={dialogStyles.title}>{t('warning')}</Text>
                </View>
                <View style={dialogStyles.body}>
                  <Text style={dialogStyles.content}>{t('confidential_complaint')}</Text>
                </View>
                <View style={dialogStyles.footer}>
                  <TouchableOpacity
                    style={[dialogStyles.button, dialogStyles.destructiveButton]}
                    onPress={_hideDialog}
                    activeOpacity={0.8}
                  >
                    <Text style={[dialogStyles.buttonText, dialogStyles.destructiveButtonText]}>
                      {t('no')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[dialogStyles.button, dialogStyles.primaryButton]}
                    onPress={() => {
                      _hideDialog();
                      submitIssue();
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[dialogStyles.buttonText, dialogStyles.primaryButtonText]}>
                      {t('yes')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Fullscreen Image Modal */}
      {modalVisible && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.95)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <TouchableOpacity
            style={{ position: 'absolute', top: 40, right: 20, zIndex: 10000 }}
            onPress={() => setModalVisible(false)}
          >
            <MaterialCommunityIcons name="close" size={36} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: modalImageUri }}
            style={{ width: '90%', height: '70%', resizeMode: 'contain' }}
          />
        </View>
      )}
    </ScrollView>
  );
};

// ✅ Enhanced withObservables with proper status inclusion
const enhance = withObservables([], () => ({
  // Include statuses for initial status lookup using shared lookup processing
  categories: watermelonManager.getDatabase().get('grm_issue_categories').query().observe(),
  types: watermelonManager.getDatabase().get('grm_issue_types').query().observe(),
  statuses: watermelonManager.getDatabase().get('grm_issue_statuses').query().observe(),
}));

const dialogStyles = RNStyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 4 },
  title: { fontSize: 20, fontFamily: 'Poppins_600SemiBold', color: '#1a1a1a' },
  body: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8 },
  content: { fontSize: 15, lineHeight: 22, color: '#555', fontFamily: 'Poppins_400Regular' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  primaryButton: { backgroundColor: colors.primary },
  destructiveButton: { backgroundColor: '#fef2f2' },
  buttonText: { fontSize: 15, fontFamily: 'Poppins_500Medium' },
  primaryButtonText: { color: '#fff' },
  destructiveButtonText: { color: '#dc2626' },
});

export default enhance(Content);

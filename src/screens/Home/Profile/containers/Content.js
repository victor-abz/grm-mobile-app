/* eslint-disable no-use-before-define */
import React, { useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  StyleSheet as RNStyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { Button, TextInput, HelperText, IconButton, Avatar } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../../../../providers/AuthProvider';
import LanguageSelector from '../../../../translations/TranslationComponent';
import { colors } from '../../../../utils/colors';
import ProfileItem from '../components/ProfileItem';
import NetworkLogViewer from '../components/NetworkLogViewer';
import { useFrappe } from '../../../../providers/FrappeProvider';
import { getVersionDisplay, checkForUpdates } from '../../../../utils/version';
import styles from './Content.style';

// Create a wrapper component using React Native Paper Avatar
const ProfileAvatar = ({ size = 80, src, name }) => {
  if (src) {
    return <Avatar.Image size={size} source={{ uri: src }} />;
  }

  return (
    <Avatar.Text size={size} label={name || '?'} style={{ backgroundColor: colors.primary }} />
  );
};

const Content = ({ profileData, isOnline, error }) => {
  const { t } = useTranslation();
  const { logout } = useContext(AuthContext);
  const { auth } = useFrappe();

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [showNetworkLog, setShowNetworkLog] = useState(false);

  useEffect(() => {
    checkForUpdates(t);
  }, []);

  const handleImagePick = async () => {
    if (!isOnline) {
      Alert.alert(t('error'), t('Cannot update profile image while offline'), [
        { text: t('OK'), style: 'default' },
      ]);
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('error'), t('Camera access permission was denied'), [
          { text: t('OK'), style: 'default' },
        ]);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setImageLoading(true);
        try {
          const formData = new FormData();
          formData.append('file', {
            uri: result.assets[0].uri,
            type: 'image/jpeg',
            name: 'profile.jpg',
          });

          await auth.uploadFile(formData);
          Alert.alert(t('success'), t('profile_image_updated'));
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          Alert.alert(t('error'), t('Failed to upload profile image. Please try again'), [
            { text: t('OK'), style: 'default' },
          ]);
        } finally {
          setImageLoading(false);
        }
      }
    } catch (pickError) {
      console.error('Error picking image:', pickError);
      Alert.alert(t('error'), t('Failed to select image. Please try again'), [
        { text: t('OK'), style: 'default' },
      ]);
    }
  };

  const handlePasswordChange = async () => {
    if (!isOnline) {
      Alert.alert(t('error'), t('Cannot change password while offline'), [
        { text: t('OK'), style: 'default' },
      ]);
      return;
    }

    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError(t('Please fill in all password fields'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t('New passwords do not match'));
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(t('Password must be at least 8 characters'));
      return;
    }

    setIsUpdating(true);
    try {
      await auth.updatePassword({
        old_password: currentPassword,
        new_password: newPassword,
      });

      setShowPasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
      Alert.alert(t('success'), t('Password updated successfully'));
    } catch (updateError) {
      console.error('Error updating password:', updateError);
      setPasswordError(
        updateError.message?.includes('old password is incorrect')
          ? t('Current password is incorrect')
          : t('Failed to update password. Please try again')
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const renderErrorMessage = () => {
    if (!error) return null;

    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>{t('An error occurred')}</Text>
        <Text style={styles.errorText}>{error}</Text>
        {!isOnline && (
          <Text style={styles.errorHint}>{t('Please check your internet connection')}</Text>
        )}
      </View>
    );
  };

  const renderConnectionStatus = () => {
    if (!isOnline) {
      return (
        <View style={styles.offlineContainer}>
          <IconButton icon="cloud-off-outline" size={20} iconColor={colors.error} />
          <Text style={styles.offlineText}>
            {t('Working offline - some features are disabled')}
          </Text>
        </View>
      );
    }
    return null;
  };

  const getInitials = (name) => {
    if (!name) return '';
    // Get the first word (first name)
    const [firstName] = name.split(' ');
    // Take first two characters of the first name
    return firstName.slice(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      {renderConnectionStatus()}

      <View style={styles.headerSection}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={2}>
              {profileData?.full_name || profileData?.email}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {profileData?.email}
            </Text>
            {isOnline && (
              <TouchableOpacity
                onPress={() => setShowPasswordDialog(true)}
                style={styles.changePasswordButton}
              >
                <Text style={styles.changePasswordText}>{t('Change Password')}</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={handleImagePick}
            disabled={imageLoading || !isOnline}
            style={[styles.avatarContainer, !isOnline && styles.avatarContainerDisabled]}
          >
            {imageLoading ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <>
                <ProfileAvatar
                  size={80}
                  src={profileData?.user_image}
                  name={getInitials(profileData?.full_name || profileData?.email)}
                />
                {isOnline && (
                  <View style={styles.editIconContainer}>
                    <IconButton icon="pencil" size={16} iconColor="white" style={styles.editIcon} />
                  </View>
                )}
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoSection}>
        <ProfileItem title={t('full_name')} description={profileData?.full_name || '-'} />
        <ProfileItem title={t('Phone')} description={profileData?.phone || '-'} />
        <ProfileItem title={t('email')} description={profileData?.email} />

        {profileData?.assignments?.length > 0 && (
          <>
            {profileData.assignments.map((assignment, index) => (
              <ProfileItem
                key={assignment.region?.id || assignment.department?.id || `assignment-${index}`}
                title={assignment.region?.name || t('region')}
                description={assignment.department?.name || t('department')}
              />
            ))}
          </>
        )}

        {profileData?.last_sync && (
          <ProfileItem
            title={t('last_sync')}
            description={new Date(profileData.last_sync).toLocaleString()}
          />
        )}
      </View>

      <View style={styles.settingsSection}>
        <LanguageSelector />

        <Text
          style={{
            textAlign: 'center',
            color: '#999',
            fontSize: 12,
            marginVertical: 12,
            fontFamily: 'Poppins_400Regular',
          }}
        >
          {t('version_label')}: {getVersionDisplay()}
        </Text>

        <Button
          mode="outlined"
          icon="wrench"
          onPress={() => setShowNetworkLog(true)}
          style={styles.button}
        >
          {t('debug_network_log')}
        </Button>

        <NetworkLogViewer visible={showNetworkLog} onDismiss={() => setShowNetworkLog(false)} />

        <Button
          mode="contained"
          onPress={() => {
            Alert.alert(t('Confirm Logout'), t('Are you sure you want to logout?'), [
              { text: t('Cancel'), style: 'cancel' },
              {
                text: t('Logout'),
                onPress: async () => {
                  try {
                    await logout();
                  } catch (logoutError) {
                    console.error('Logout failed:', logoutError);
                    Alert.alert(t('error'), t('Failed to logout. Please try again.'));
                  }
                },
                style: 'destructive',
              },
            ]);
          }}
          style={[styles.button, styles.logoutButton]}
          buttonColor={colors.primary}
          disabled={isUpdating}
        >
          {t('Logout')}
        </Button>
      </View>

      <Modal
        visible={showPasswordDialog}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isUpdating) {
            setShowPasswordDialog(false);
            setPasswordError('');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
          }
        }}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback
          onPress={() => {
            if (!isUpdating) {
              setShowPasswordDialog(false);
              setPasswordError('');
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            }
          }}
        >
          <View style={pwDialogStyles.backdrop}>
            <TouchableWithoutFeedback>
              <View style={pwDialogStyles.card}>
                <View style={pwDialogStyles.header}>
                  <Text style={pwDialogStyles.title}>{t('Change Password')}</Text>
                </View>
                <View style={pwDialogStyles.body}>
                  <TextInput
                    label={t('Current Password')}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                    style={styles.input}
                    mode="outlined"
                    disabled={isUpdating}
                    error={!!passwordError}
                    outlineStyle={{ borderRadius: 12 }}
                  />
                  <TextInput
                    label={t('New Password')}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    style={styles.input}
                    mode="outlined"
                    disabled={isUpdating}
                    error={!!passwordError}
                    outlineStyle={{ borderRadius: 12 }}
                  />
                  <TextInput
                    label={t('Confirm New Password')}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    style={styles.input}
                    mode="outlined"
                    disabled={isUpdating}
                    error={!!passwordError}
                    outlineStyle={{ borderRadius: 12 }}
                  />
                  {passwordError ? (
                    <HelperText type="error" visible={!!passwordError}>
                      {passwordError}
                    </HelperText>
                  ) : null}
                </View>
                <View style={pwDialogStyles.footer}>
                  <TouchableOpacity
                    style={[pwDialogStyles.button, pwDialogStyles.secondaryButton]}
                    onPress={() => {
                      setShowPasswordDialog(false);
                      setPasswordError('');
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    disabled={isUpdating}
                    activeOpacity={0.8}
                  >
                    <Text style={[pwDialogStyles.buttonText, pwDialogStyles.secondaryButtonText]}>
                      {t('Cancel')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      pwDialogStyles.button,
                      pwDialogStyles.primaryButton,
                      isUpdating && pwDialogStyles.disabledButton,
                    ]}
                    onPress={handlePasswordChange}
                    disabled={isUpdating}
                    activeOpacity={0.8}
                  >
                    {isUpdating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={[pwDialogStyles.buttonText, pwDialogStyles.primaryButtonText]}>
                        {t('Update')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {renderErrorMessage()}
    </View>
  );
};

const pwDialogStyles = RNStyleSheet.create({
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
  secondaryButton: { backgroundColor: '#f0f0f0' },
  disabledButton: { backgroundColor: '#e0e0e0', opacity: 0.6 },
  buttonText: { fontSize: 15, fontFamily: 'Poppins_500Medium' },
  primaryButtonText: { color: '#fff' },
  secondaryButtonText: { color: '#666' },
});

export default Content;

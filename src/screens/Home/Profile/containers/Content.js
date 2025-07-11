import UserAvatar from '@muhzi/react-native-user-avatar';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Button, TextInput, Portal, Dialog, HelperText, IconButton } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { logout } from '../../../../store/ducks/authentication.duck';
import LanguageSelector from '../../../../translations/TranslationComponent';
import { colors } from '../../../../utils/colors';
import ProfileItem from '../components/ProfileItem';
import { useFrappe } from '../../../../providers/FrappeProvider';
import styles from './Content.style';

// Create a wrapper component for UserAvatar to handle default props
const ProfileAvatar = ({
  size = 80,
  src,
  name,
  backgroundColor = colors.primary,
  textColor = 'white',
}) => {
  return (
    <UserAvatar
      size={size}
      src={src}
      userName={name}
      backgroundColor={backgroundColor}
      textColor={textColor}
    />
  );
};

function Content({ profileData, isOnline, error }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { auth } = useFrappe();

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

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
        } catch (error) {
          console.error('Error uploading image:', error);
          Alert.alert(t('error'), t('Failed to upload profile image. Please try again'), [
            { text: t('OK'), style: 'default' },
          ]);
        } finally {
          setImageLoading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
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
    } catch (error) {
      console.error('Error updating password:', error);
      setPasswordError(
        error.message?.includes('old password is incorrect')
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
    const firstName = name.split(' ')[0];
    // Take first two characters of the first name
    return firstName.slice(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      {renderConnectionStatus()}

      <View style={styles.headerSection}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{profileData?.full_name || profileData?.email}</Text>
            <Text style={styles.userEmail}>{profileData?.email}</Text>
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
                key={index}
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

        {isOnline && (
          <Button
            mode="outlined"
            onPress={() => setShowPasswordDialog(true)}
            style={styles.button}
            disabled={isUpdating}
          >
            {t('change_password')}
          </Button>
        )}

        <Button
          mode="contained"
          onPress={() => {
            Alert.alert(t('Confirm Logout'), t('Are you sure you want to logout?'), [
              { text: t('Cancel'), style: 'cancel' },
              {
                text: t('Logout'),
                onPress: () => dispatch(logout()),
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

      <Portal>
        <Dialog
          visible={showPasswordDialog}
          onDismiss={() => {
            if (!isUpdating) {
              setShowPasswordDialog(false);
              setPasswordError('');
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            }
          }}
        >
          <Dialog.Title>{t('Change Password')}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label={t('Current Password')}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              style={styles.input}
              disabled={isUpdating}
              error={!!passwordError}
            />
            <TextInput
              label={t('New Password')}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              style={styles.input}
              disabled={isUpdating}
              error={!!passwordError}
            />
            <TextInput
              label={t('Confirm New Password')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={styles.input}
              disabled={isUpdating}
              error={!!passwordError}
            />
            {passwordError ? (
              <HelperText type="error" visible={!!passwordError}>
                {passwordError}
              </HelperText>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setShowPasswordDialog(false);
                setPasswordError('');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              disabled={isUpdating}
            >
              {t('Cancel')}
            </Button>
            <Button onPress={handlePasswordChange} loading={isUpdating} disabled={isUpdating}>
              {t('Update')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {renderErrorMessage()}
    </View>
  );
}

export default Content;

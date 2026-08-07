import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { Alert } from 'react-native';
import { logger } from './logger';

export const getAppVersion = () => Constants.expoConfig?.version || '1.0.0';
export const getBuildNumber = () =>
  Constants.expoConfig?.extra?.buildNumber || Constants.expoConfig?.android?.versionCode || 1;
export const getRuntimeVersion = () => Constants.expoConfig?.runtimeVersion || getAppVersion();

export const getVersionDisplay = () => `v${getAppVersion()}`;

/**
 * Silently pull and apply an OTA update at cold start.
 *
 * Called before the user has any work in progress, so applying immediately is
 * safe and needs no prompt — this is what makes an APK installed from the
 * portal self-update the first time it runs online. Returns true when an
 * update was applied (the app reloads, so callers rarely observe it).
 */
export const applyUpdateOnStartup = async () => {
  if (__DEV__) return false;

  try {
    const update = await Updates.checkForUpdateAsync();
    if (!update.isAvailable) return false;

    await Updates.fetchUpdateAsync();
    logger.info('OTA update fetched at startup, reloading');
    await Updates.reloadAsync();
    return true;
  } catch (e) {
    // Offline or unreachable update server: keep running the current bundle.
    logger.warn('Startup update check failed', e);
    return false;
  }
};

/**
 * Interactive update check for use once the app is in the user's hands, where
 * an unannounced reload could discard in-progress input.
 */
export const checkForUpdates = async (t) => {
  if (__DEV__) return;

  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      Alert.alert(t('update_available'), t('update_available_message'), [
        { text: t('later'), style: 'cancel' },
        {
          text: t('update_now'),
          onPress: async () => {
            try {
              await Updates.fetchUpdateAsync();
              await Updates.reloadAsync();
            } catch (e) {
              logger.error('Failed to fetch update', e);
            }
          },
        },
      ]);
    }
  } catch (e) {
    logger.warn('Update check failed', e);
  }
};

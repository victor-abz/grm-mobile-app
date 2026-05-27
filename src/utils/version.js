import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { Alert } from 'react-native';
import { logger } from './logger';

export const getAppVersion = () => Constants.expoConfig?.version || '1.0.0';
export const getBuildNumber = () =>
  Constants.expoConfig?.extra?.buildNumber || Constants.expoConfig?.android?.versionCode || 1;
export const getRuntimeVersion = () => Constants.expoConfig?.runtimeVersion || getAppVersion();

export const getVersionDisplay = () => `v${getAppVersion()}`;

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

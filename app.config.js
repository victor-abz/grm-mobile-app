const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const APP_VERSION = '1.2.0';
const BUILD_NUMBER = 2;

const getUpdatesUrl = () => {
  if (process.env.EXPO_PUBLIC_UPDATES_URL) {
    return process.env.EXPO_PUBLIC_UPDATES_URL;
  }
  // Default: Expo's hosted updates service
  return 'https://u.expo.dev/13cc8fd9-97c4-46f0-9f52-d0b0043066cd';
};

const getAppName = () => {
  if (IS_DEV) return 'eGRM (Dev)';
  if (IS_PREVIEW) return 'eGRM (Preview)';
  return 'eGRM';
};

module.exports = ({ config }) => ({
  ...config,
  name: getAppName(),
  version: APP_VERSION,
  ios: {
    ...config.ios,
    buildNumber: String(BUILD_NUMBER),
  },
  android: {
    ...config.android,
    versionCode: BUILD_NUMBER,
  },
  updates: {
    ...config.updates,
    url: getUpdatesUrl(),
  },
  runtimeVersion: APP_VERSION,
  extra: {
    ...config.extra,
    appVersion: APP_VERSION,
    buildNumber: BUILD_NUMBER,
  },
});

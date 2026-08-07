const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

// User-facing version. Bump freely for every release, including patch-level
// OTA-only fixes — after an update installs, expo-updates serves the new
// manifest and `Constants.expoConfig.version` reports this new value, so the
// number the user sees tracks what they are actually running.
const APP_VERSION = '1.2.1';
const BUILD_NUMBER = 2;

// Native runtime contract — deliberately NOT tied to APP_VERSION.
//
// expo-updates only delivers an update to a binary whose runtimeVersion
// matches exactly. When runtimeVersion was `APP_VERSION`, bumping the version
// to ship a fix silently cut off every already-installed app: the new update
// no longer matched their embedded runtime version, so they kept running the
// old JS forever.
//
// Keeping this fixed means an APK downloaded from the portal months ago still
// matches, and still pulls the newest OTA update. Bump it ONLY when native
// code changes (new native module, Expo SDK upgrade, config-plugin change),
// which requires distributing a new APK regardless.
const RUNTIME_VERSION = '1.2.0';

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
  runtimeVersion: RUNTIME_VERSION,
  extra: {
    ...config.extra,
    appVersion: APP_VERSION,
    buildNumber: BUILD_NUMBER,
  },
});

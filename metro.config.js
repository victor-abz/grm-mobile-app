const { getDefaultConfig } = require('@expo/metro-config');

let getBaseConfig = getDefaultConfig;
try {
  const sentryMetro = require('@sentry/react-native/metro');
  if (sentryMetro?.getSentryExpoConfig) {
    getBaseConfig = sentryMetro.getSentryExpoConfig;
  }
} catch (e) {
  console.warn('Sentry metro config unavailable, using default Expo config');
}

module.exports = (async () => {
  const config = await getBaseConfig(__dirname);
  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  };
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...resolver.sourceExts, 'svg'],
  };

  return config;
})();

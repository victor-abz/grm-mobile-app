const { getSentryExpoConfig } = require('@sentry/react-native/metro');

// Get the default config
const config = getSentryExpoConfig(__dirname);

// Add SVG support - remove svg from asset extensions and add it to source extensions
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts.push('svg');

// Configure the SVG transformer
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

module.exports = config;

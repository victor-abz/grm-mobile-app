const { withGradleProperties } = require('@expo/config-plugins');

module.exports = (config) =>
  withGradleProperties(config, (pluginConfig) => {
    // Check if the property already exists
    const existingPropertyIndex = pluginConfig.modResults.findIndex(
      (item) => item.type === 'property' && item.key === 'AsyncStorage_db_size_in_MB'
    );

    // Update the value if it exists, otherwise add a new property
    if (existingPropertyIndex !== -1) {
      pluginConfig.modResults[existingPropertyIndex].value = '50';
    } else {
      pluginConfig.modResults.push({
        type: 'property',
        key: 'AsyncStorage_db_size_in_MB',
        value: '50',
      });
    }

    return pluginConfig;
  });

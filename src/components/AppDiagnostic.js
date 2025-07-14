import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
  },
  status: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'green',
    marginTop: 16,
  },
});

const AppDiagnostic = () => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('App Diagnostic')}</Text>
      <Text style={styles.text}>{t('✅ React Native is working')}</Text>
      <Text style={styles.text}>{t('✅ Components can render')}</Text>
      <Text style={styles.text}>{t('✅ JavaScript bundle loaded')}</Text>
      <Text style={styles.status}>{t('Status: App is functional')}</Text>
    </View>
  );
};

export default AppDiagnostic;

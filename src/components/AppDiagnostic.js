import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333333',
  },
  text: {
    fontSize: 16,
    marginVertical: 5,
    color: '#666666',
  },
  status: {
    fontSize: 18,
    marginTop: 20,
    fontWeight: 'bold',
    color: '#28a745',
  },
});

export default AppDiagnostic;

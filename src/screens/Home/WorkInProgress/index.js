import React from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, Text } from 'react-native';

export const WorkInProgress = () => {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>{t('Work in Progress')}</Text>
    </SafeAreaView>
  );
};

export default WorkInProgress;

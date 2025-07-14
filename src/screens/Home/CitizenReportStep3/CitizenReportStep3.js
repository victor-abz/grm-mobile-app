import React from 'react';
import { SafeAreaView } from 'react-native';
import { withObservables } from '@nozbe/watermelondb/react';
import watermelonManager from '../../../database/watermelonManager';
import { styles } from './CitizenReportStep3.styles';
import Content from './containers/Content';

const CitizenReportStep3 = ({ route, statuses = [] }) => {
  const { params } = route;
  const customStyles = styles();

  console.log('🔍 [CitizenReportStep3] Component received statuses:', statuses?.length || 0);

  return (
    <SafeAreaView style={customStyles.container}>
      <Content
        stepOneParams={params?.stepOneParams || {}}
        stepTwoParams={params?.stepTwoParams || {}}
        stepLocationParams={params?.stepLocationParams || {}}
        statuses={statuses}
      />
    </SafeAreaView>
  );
};

// Enhanced withObservables to get statuses data
const enhance = withObservables([], () => {
  try {
    return {
      statuses: watermelonManager.getDatabase().get('grm_issue_statuses').query().observe(),
    };
  } catch (error) {
    console.error('Error setting up CitizenReportStep3 observables:', error);
    return {
      statuses: { subscribe: () => ({ unsubscribe: () => {} }) },
    };
  }
});

export default enhance(CitizenReportStep3);

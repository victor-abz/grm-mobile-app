import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native';
import { useSelector } from 'react-redux';
import Content from './containers/Content';
import { styles } from './CitizenReportLocationStep.styles';
import { useAdministrativeRegions } from '../../../hooks/issues/useAdministrativeRegions';

function CitizenReportLocationStep({ route }) {
  const { params } = route;
  const { administrativeRegionsList, loading } = useAdministrativeRegions();
  const { profile } = useSelector((state) => state.get('authentication').toObject());
  
  const customStyles = styles();
  return (
    <SafeAreaView style={customStyles.container}>
      <Content
        stepOneParams={params.stepOneParams}
        stepTwoParams={params.stepTwoParams}
        issueCommunes={administrativeRegionsList}
        uniqueRegion={profile.administrative_region}
      />
    </SafeAreaView>
  );
}

export default CitizenReportLocationStep;

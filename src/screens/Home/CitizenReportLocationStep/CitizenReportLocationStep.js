import React from 'react';
import { SafeAreaView, ScrollView, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useAllDocs, useView } from 'use-pouchdb';
import { styles } from './CitizenReportLocationStep.styles';
import Content from './containers/Content';

function CitizenReportLocationStep({ route }) {
  const { params } = route;

  const { username } = useSelector((state) => state.get('authentication').toObject());

  const { rows: representative, loading: uniqueRegionLoading } = useView(
    'eadl/by_representative_email',
    {
      key: username,
      include_docs: true,
      db: 'LocalCommunesDatabase',
    }
  );

  const uniqueRegion = representative.map((d) => d.doc);

  const { rows: issueCommunes, loading: issueCommunesLoading } = useView('communes/by_type', {
    db: 'LocalCommunesDatabase',
    key: 'administrative_level',
    include_docs: true,
  });

  const { rows } = useAllDocs({ db: 'LocalCommunesDatabase' });

  console.log({ representative, issueCommunes, rows });
  const customStyles = styles();
  return (
    <SafeAreaView style={customStyles.container}>
      {uniqueRegionLoading || issueCommunesLoading ? (
        <ScrollView
          style={{
            backgroundColor: 'white',
            flex: 1,
          }}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View
            style={{
              zIndex: 20,
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator size="large" color="#24c38b" />
          </View>
        </ScrollView>
      ) : (
        <Content
          stepOneParams={params.stepOneParams}
          stepTwoParams={params.stepTwoParams}
          issueCommunes={issueCommunes.map((commune) => commune.doc)}
          uniqueRegion={uniqueRegion?.[0]}
        />
      )}
    </SafeAreaView>
  );
}

export default CitizenReportLocationStep;

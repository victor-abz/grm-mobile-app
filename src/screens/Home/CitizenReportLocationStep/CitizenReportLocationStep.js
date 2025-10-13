import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { useSelector } from 'react-redux';
import Content from './containers/Content';
import { styles } from './CitizenReportLocationStep.styles';
import { LocalAdminLevelsDatabase, LocalCommunesDatabase } from '../../../db/databaseManager';

function CitizenReportLocationStep({ route }) {
  const { params } = route;
  const [issueCommunes, setIssueCommunes] = useState();
  const [uniqueRegion, setUniqueRegion] = useState();

  const { session } = useSelector((state) => state.get('authentication').toObject());
  const username = session?.username ?? '';
 
  // fetch administrative levels
  // fetch facilitator
  // fetch administrative region from facilitator's unique region 

  //
  useEffect(() => {
    if (username) {
      LocalAdminLevelsDatabase.find({
        // FACILITATOR
        selector: { 'representative.email': username },
        // fields: ["_id", "commune", "phases"],
      })
        .then((result) => {
          const facilitator = result.docs[0];
          // if the facilitator has unique_region == true
          // TODO: fetch facilitator

          if (facilitator && facilitator?.unique_region === 1) {
            LocalCommunesDatabase.find({
              // it looks like administrative_id is now just the id of the administrative_region
              selector: { administrative_id: facilitator.administrative_region },
            }).then((regions) => {
              setUniqueRegion(regions.docs[0]);
              console.log('unique region : ' + regions.docs[0]);
            });
          }
          console.log('no unique region : ');
          // handle result
        })
        .catch((err) => {
          console.log('ERROR FETCHING EADL', err);
        });
    }
  }, [username]);

  useEffect(() => {
    // FETCH administrative levels
    LocalCommunesDatabase.find({
      selector: { type: 'administrative_level' },
    }).then((result) => {
      setIssueCommunes(result?.docs);
      console.log('issues communes : ' + result?.docs[0]);
    });
  }, []);

  const customStyles = styles();
  return (
    <SafeAreaView style={customStyles.container}>
      <Content
        stepOneParams={params.stepOneParams}
        stepTwoParams={params.stepTwoParams}
        issueCommunes={issueCommunes}
        uniqueRegion={uniqueRegion}
      />
    </SafeAreaView>
  );
}

export default CitizenReportLocationStep;

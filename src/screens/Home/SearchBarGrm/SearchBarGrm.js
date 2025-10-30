import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import Content from './containers';
import { styles } from './SearchBarGrm.style';
import { LocalAdminLevelsDatabase, LocalGRMDatabase } from '../../../db/databaseManager';

//fetch issues: is assigne + is reporter
// having the eadl here might not be necessary to filter issues, because 
// available issues are now from the authenticated user (check for other similar cases)

function SearchBarGrm() {
  const [eadl, setEadl] = useState(false);
  const [issues, setIssues] = useState();
  const { session } = useSelector((state) => state.get('authentication').toObject());
  const username = session?.username ?? ''
  
  useEffect(() => {
    if (username) {
      LocalAdminLevelsDatabase.find({
        selector: { 'representative.email': username },
      })
        .then((result) => {
          setEadl(result.docs[0]);
        })
        .catch((err) => {
          console.log('ERROR FETCHING EADL', err);
        });
    }
  }, [username]);

  useEffect(() => {
    if (eadl) {
      LocalGRMDatabase.find({
        selector: {
          type: 'issue',
          '$or': [
            {'reporter.id': eadl._id},
            {'assignee.id': eadl._id}
          ]
        },
      })
        .then((result) => {
          setIssues(result?.docs);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [eadl]);


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Content issues={issues} eadl={eadl} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default SearchBarGrm;

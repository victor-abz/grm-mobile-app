import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import Content from './containers';
import { styles } from './SearchBarGrm.style';
import LocalDatabase, { LocalGRMDatabase } from '../../../utils/databaseManager';

function SearchBarGrm() {
  const [eadl, setEadl] = useState(false);
  const [issues, setIssues] = useState();
  const { username } = useSelector((state) => state.get('authentication').toObject());

  useEffect(() => {
    if (username) {
      LocalDatabase.find({
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

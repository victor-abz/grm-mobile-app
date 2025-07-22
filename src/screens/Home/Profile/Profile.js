import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import Content from './containers';
import { styles } from './Profile.style';
import LocalDatabase, { LocalGRMDatabase } from '../../../utils/databaseManager';

function Profile() {
  const [eadl, setEadl] = useState(false);
  const [issues, setIssues] = useState();
  const [statuses, setStatuses] = useState();
  const [department, setDepartment] = useState(false);
  const { username } = useSelector((state) => state.get('authentication').toObject());

  useEffect(() => {
    LocalGRMDatabase.find({
      selector: { type: 'issue_status' },
    })
      .then((result) => {
        setStatuses(result.docs);
      })
      .catch((err) => {
        alert(`Unable to retrieve statuses. ${JSON.stringify(err)}`);
      });
  }, []);

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
      // FETCH DEPARTMENT INFO
      LocalGRMDatabase.find({
        selector: {
          type: 'issue_department',
          'id': eadl.department,
        },
      })
        .then((result) => {
          setDepartment(result?.docs[0]);
        })
        .catch((err) => {
          console.log(err);
        });

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
        <Content issues={issues} eadl={eadl} department={department} statuses={statuses} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default Profile;

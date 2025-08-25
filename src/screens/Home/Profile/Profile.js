import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import Content from './containers';
import { styles } from './Profile.style';
import { LocalAdminLevelsDatabase, LocalGRMDatabase } from '../../../db/databaseManager';
import { useIssueStatus } from '../../../hooks/issues/useIssueStatus';

function Profile()
{
  const [eadl, setEadl] = useState(false);
  const [issues, setIssues] = useState();
  const {issueStatusList, loading} = useIssueStatus();
  const [department, setDepartment] = useState(false);
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
        <Content issues={issues} eadl={eadl} department={department} statuses={issueStatusList} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default Profile;

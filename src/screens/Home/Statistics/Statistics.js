import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { ActivityIndicator } from 'react-native-paper';
import Content from './containers';
import { styles } from './Statistics.style';
import LocalDatabase, { LocalGRMDatabase } from '../../../utils/databaseManager';
import { colors } from '../../../utils/colors';

function Statistics() {
  const customStyles = styles();
  const [issues, setIssues] = useState();
  const [issueType, setIssueType] = useState();
  const [statuses, setStatuses] = useState();
  const [ageGroup, setAgeGroup] = useState();
  const [citizenGroup1, setCitizenGroup1] = useState();
  const [citizenGroup2, setCitizenGroup2] = useState();
  const [issueCategory, setIssueCategory] = useState();
  const [issueComponent, setIssueComponent] = useState();
  const [issueSubComponent, setIssueSubComponent] = useState();
  const [eadl, setEadl] = useState(false);
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

    // Getting issue_age_group
    LocalGRMDatabase.find({
      selector: { type: 'issue_age_group' },
    })
      .then((result) => {
        setAgeGroup(result.docs);
      })
      .catch((err) => {
        alert(`Unable to retrieve issue age group. ${JSON.stringify(err)}`);
      });

    // Getting issue_citizen_group_1
    LocalGRMDatabase.find({
      selector: { type: 'issue_citizen_group_1' },
    })
      .then((result) => {
        setCitizenGroup1(result.docs);
      })
      .catch((err) => {
        alert(`Unable to retrieve issue citizen group 1. ${JSON.stringify(err)}`);
      });

    // Getting issue_citizen_group_2
    LocalGRMDatabase.find({
      selector: { type: 'issue_citizen_group_2' },
    })
      .then((result) => {
        setCitizenGroup2(result.docs);
      })
      .catch((err) => {
        alert(`Unable to retrieve issue citizen group 2. ${JSON.stringify(err)}`);
      });

    // Getting issue_type
    LocalGRMDatabase.find({
      selector: { type: 'issue_type' },
    })
      .then((result) => {
        setIssueType(result.docs);
      })
      .catch((err) => {
        alert(`Unable to retrieve issue type. ${JSON.stringify(err)}`);
      });

    // Getting issue_category
    LocalGRMDatabase.find({
      selector: { type: 'issue_category' },
    })
      .then((result) => {
        setIssueCategory(result.docs);
      })
      .catch((err) => {
        alert(`Unable to retrieve issue category. ${JSON.stringify(err)}`);
      });

    // Getting issue_component
    LocalGRMDatabase.find({
      selector: { type: 'issue_component' },
    })
      .then((result) => {
        setIssueComponent(result.docs);
      })
      .catch((err) => {
        alert(`Unable to retrieve issue component. ${JSON.stringify(err)}`);
      });

    // Getting issue_sub_component
    LocalGRMDatabase.find({
      selector: { type: 'issue_sub_component' },
    })
      .then((result) => {
        setIssueSubComponent(result.docs);
      })
      .catch((err) => {
        alert(`Unable to retrieve issue sub component. ${JSON.stringify(err)}`);
      });
  }, []);

  useEffect(() => {
    if (username) {
      LocalDatabase.find({
        selector: { 'representative.email': username },
        // fields: ["_id", "commune", "phases"],
      })
        .then((result) => {
          setEadl(result.docs[0]);

          // handle result
        })
        .catch((err) => {
          console.log('ERROR FETCHING EADL', err);
        });
    }
  }, [username]);

  useEffect(() => {
    // FETCH ISSUE CATEGORY
    if (eadl) {
      LocalGRMDatabase.find({
        selector: {
          type: 'issue',
          'reporter.id': eadl._id,
          //'reporter.name': eadl.representative.name,
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

  if (!issues)
    return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" />;
  return (
    <SafeAreaView style={customStyles.container}>
      <ScrollView>
        <Content issues={issues} eadl={eadl}
                 statuses={statuses}
                 ageGroup={ageGroup}
                 citizenGroup1={citizenGroup1}
                 citizenGroup2={citizenGroup2}
                 issueType={issueType}
                 issueCategory={issueCategory}
                 issueComponent={issueComponent}
                 issueSubComponent={issueSubComponent}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

export default Statistics;

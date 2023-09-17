import React, { useEffect } from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useFind } from 'use-pouchdb';
import { colors } from '../../../utils/colors';
import { styles } from './Statistics.style';
import Content from './containers';

function Statistics() {
  const customStyles = styles();
  // const [issues, setIssues] = useState();
  // const [issueType, setIssueType] = useState();
  // const [statuses, setStatuses] = useState();
  // const [ageGroup, setAgeGroup] = useState();
  // const [citizenGroup1, setCitizenGroup1] = useState();
  // const [citizenGroup2, setCitizenGroup2] = useState();
  // const [issueCategory, setIssueCategory] = useState();
  // const [issueComponent, setIssueComponent] = useState();
  // const [issueSubComponent, setIssueSubComponent] = useState();
  // const [eadl, setEadl] = useState(false);
  const { username } = useSelector((state) => state.get('authentication').toObject());

  useEffect(() => {
    // LocalGRMDatabase.find({
    //   selector: { type: 'issue_status' },
    // })
    //   .then((result) => {
    //     setStatuses(result.docs);
    //   })
    //   .catch((err) => {
    //     alert(`Unable to retrieve statuses. ${JSON.stringify(err)}`);
    //   });
    // // Getting issue_age_group
    // LocalGRMDatabase.find({
    //   selector: { type: 'issue_age_group' },
    // })
    //   .then((result) => {
    //     setAgeGroup(result.docs);
    //   })
    //   .catch((err) => {
    //     alert(`Unable to retrieve issue age group. ${JSON.stringify(err)}`);
    //   });
    // // Getting issue_citizen_group_1
    // LocalGRMDatabase.find({
    //   selector: { type: 'issue_citizen_group_1' },
    // })
    //   .then((result) => {
    //     setCitizenGroup1(result.docs);
    //   })
    //   .catch((err) => {
    //     alert(`Unable to retrieve issue citizen group 1. ${JSON.stringify(err)}`);
    //   });
    // // Getting issue_citizen_group_2
    // LocalGRMDatabase.find({
    //   selector: { type: 'issue_citizen_group_2' },
    // })
    //   .then((result) => {
    //     setCitizenGroup2(result.docs);
    //   })
    //   .catch((err) => {
    //     alert(`Unable to retrieve issue citizen group 2. ${JSON.stringify(err)}`);
    //   });
    // // Getting issue_type
    // LocalGRMDatabase.find({
    //   selector: { type: 'issue_type' },
    // })
    //   .then((result) => {
    //     setIssueType(result.docs);
    //   })
    //   .catch((err) => {
    //     alert(`Unable to retrieve issue type. ${JSON.stringify(err)}`);
    //   });
    // // Getting issue_category
    // LocalGRMDatabase.find({
    //   selector: { type: 'issue_category' },
    // })
    //   .then((result) => {
    //     setIssueCategory(result.docs);
    //   })
    //   .catch((err) => {
    //     alert(`Unable to retrieve issue category. ${JSON.stringify(err)}`);
    //   });
    // // Getting issue_component
    // LocalGRMDatabase.find({
    //   selector: { type: 'issue_component' },
    // })
    //   .then((result) => {
    //     setIssueComponent(result.docs);
    //   })
    //   .catch((err) => {
    //     alert(`Unable to retrieve issue component. ${JSON.stringify(err)}`);
    //   });
    // // Getting issue_sub_component
    // LocalGRMDatabase.find({
    //   selector: { type: 'issue_sub_component' },
    // })
    //   .then((result) => {
    //     setIssueSubComponent(result.docs);
    //   })
    //   .catch((err) => {
    //     alert(`Unable to retrieve issue sub component. ${JSON.stringify(err)}`);
    //   });
  }, []);

  // useEffect(() => {
  //   if (username) {
  //     LocalDatabase.find({
  //       selector: { 'representative.email': username },
  //       // fields: ["_id", "commune", "phases"],
  //     })
  //       .then((result) => {
  //         setEadl(result.docs[0]);

  //         // handle result
  //       })
  //       .catch((err) => {
  //         console.log('ERROR FETCHING EADL', err);
  //       });
  //   }
  // }, [username]);

  // useEffect(() => {
  //   // FETCH ISSUE CATEGORY
  //   if (eadl) {
  //     LocalGRMDatabase.find({
  //       selector: {
  //         type: 'issue',
  //         'reporter.id': eadl?._id,
  //         //'reporter.name': eadl.representative.name,
  //       },
  //     })
  //       .then((result) => {
  //         setIssues(result?.docs);
  //       })
  //       .catch((err) => {
  //         console.log(err);
  //       });
  //   }
  // }, [eadl]);

  const { docs: statuses, loading: statusesLoading } = useFind({
    selector: {
      type: 'issue_status',
    },
    db: 'LocalGRMDatabase',
  });

  const { docs: ageGroup, loading: agesLoading } = useFind({
    selector: {
      type: 'issue_age_group',
    },
    db: 'LocalGRMDatabase',
  });

  const { docs: citizenGroup1, loading: citizenGroup1Loading } = useFind({
    selector: {
      type: 'issue_citizen_group_1',
    },
    db: 'LocalGRMDatabase',
  });
  const { docs: citizenGroup2, loading: citizenGroup2Loading } = useFind({
    selector: {
      type: 'issue_citizen_group_2',
    },
    db: 'LocalGRMDatabase',
  });

  const { docs: issueCategory, loading: issueCategoriesLoading } = useFind({
    selector: {
      type: 'issue_category',
    },
    db: 'LocalGRMDatabase',
  });

  const { docs: issueType, loading: issueTypesLoading } = useFind({
    selector: {
      type: 'issue_type',
    },
    db: 'LocalGRMDatabase',
  });

  const { docs: issueComponent, loading: issueComponentLoading } = useFind({
    selector: {
      type: 'issue_component',
    },
    db: 'LocalGRMDatabase',
  });

  const { docs: issueSubComponent, loading: issueSubComponentsLoading } = useFind({
    selector: {
      type: 'issue_sub_component',
    },
    db: 'LocalGRMDatabase',
  });

  const { docs: eadl, loading: eadlLoading } = useFind({
    selector: { 'representative.email': username },
    db: 'LocalDatabase',
  });

  const { docs: issues, loading: issuesLoading } = useFind({
    selector: {
      type: 'issue',
      $or: [{ 'reporter.id': eadl?.[0]?._id }, { 'assignee.id': eadl?.[0]?._id }],
    },
    db: 'LocalGRMDatabase',
  });

  if (
    !issues ||
    !eadl ||
    issuesLoading ||
    eadlLoading ||
    statusesLoading ||
    agesLoading ||
    citizenGroup1Loading ||
    citizenGroup2Loading ||
    issueCategoriesLoading ||
    issueSubComponentsLoading ||
    issueComponentLoading ||
    issueTypesLoading
  ) {
    return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" />;
  }
  return (
    <SafeAreaView style={customStyles.container}>
      <ScrollView>
        <Content
          issues={issues}
          eadl={eadl?.[0]}
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

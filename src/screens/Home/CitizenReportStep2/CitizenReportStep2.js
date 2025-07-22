import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import Content from './containers/Content';
import { styles } from './CitizenReportStep2.styles';
import { LocalGRMDatabase } from '../../../utils/databaseManager';

const CitizenReportStep2 = ({ route }) => {
  const { params } = route;
  const [issueCategories, setIssueCategories] = useState();
  const [issueTypes, setIssueTypes] = useState();
  const [issueSubTypes, setIssueSubTypes] = useState();
  const [issueComponents, setIssueComponents] = useState();
  const [issueSubComponents, setIssueSubComponents] = useState();

  useEffect(() => {
    // FETCH ISSUE CATEGORY
    LocalGRMDatabase.find({
      selector: { type: 'issue_category' },
    })
      .then((result) => {
        setIssueCategories(result?.docs);
      })
      .catch((err) => {
        console.log(err);
      });

    // FETCH ISSUE TYPE
    LocalGRMDatabase.find({
      selector: { type: 'issue_type' },
    })
      .then((result) => {
        setIssueTypes(result?.docs);
      })
      .catch((err) => {
        console.log(err);
      });

    // FETCH ISSUE SUB TYPE
    LocalGRMDatabase.find({
      selector: { type: 'issue_sub_type' },
    })
      .then((result) => {
        setIssueSubTypes(result?.docs);
      })
      .catch((err) => {
        console.log(err);
      });

    // FETCH ISSUE COMPONENT
    LocalGRMDatabase.find({
      selector: { type: 'issue_component' },
    })
      .then((result) => {
        setIssueComponents(result?.docs);
      })
      .catch((err) => {
        console.log(err);
      });

    // FETCH ISSUE SUB COMPONENT
    LocalGRMDatabase.find({
      selector: { type: 'issue_sub_component' },
    })
      .then((result) => {
        setIssueSubComponents(result?.docs);
      })
      .catch((err) => {
        console.log(err);
      });

  }, []);

  const customStyles = styles();
  return (
    <SafeAreaView style={customStyles.container}>
      <Content
        stepOneParams={params.stepOneParams}
        issueCategories={issueCategories}
        issueTypes={issueTypes}
        issueSubTypes={issueSubTypes}
        issueComponents={issueComponents}
        issueSubComponents={issueSubComponents}
      />
    </SafeAreaView>
  );
};

export default CitizenReportStep2;

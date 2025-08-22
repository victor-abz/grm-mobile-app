import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { LocalGRMDatabase } from '../../../db/databaseManager';
import { useIssueCategories } from '../../../services/hooks/useIssueCategories';
import { styles } from './CitizenReportStep2.styles';
import Content from './containers/Content';
import { useIssueTypes } from '../../../services/hooks/useIssueTypes';

const CitizenReportStep2 = ({ route }) => {
  const { params } = route;
  const { issueCategoriesList, loading } = useIssueCategories()
  const { issueTypesList } = useIssueTypes();
  const [issueSubTypes, setIssueSubTypes] = useState();
  const [issueComponents, setIssueComponents] = useState();
  const [issueSubComponents, setIssueSubComponents] = useState();

  useEffect(() => {

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
        issueCategories={issueCategoriesList}
        issueTypes={issueTypesList}
        issueSubTypes={issueSubTypes}
        issueComponents={issueComponents}
        issueSubComponents={issueSubComponents}
      />
    </SafeAreaView>
  );
};

export default CitizenReportStep2;

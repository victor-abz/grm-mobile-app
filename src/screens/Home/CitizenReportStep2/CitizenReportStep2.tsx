import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import Content from './containers/Content';
import { styles } from './CitizenReportStep2.styles';
import { LocalGRMDatabase } from '../../../db/databaseManager';
import { useIssueTypes } from "../../../hooks/issues/useIssueTypes";
import { useIssueCategories } from "../../../hooks/issues/useIssueCategories";
import { useIssueSubTypes } from '../../../hooks/issues/useIssueSubTypes';
import { useIssueSubComponents } from '../../../hooks/issues/useIssueSubComponents';

const CitizenReportStep2 = ({ route }) => {
  const { params } = route;
  const { issueCategoriesList, loading } = useIssueCategories();
  const { issueTypesList } = useIssueTypes();
  const [issueComponents, setIssueComponents] = useState();
  const { issueSubTypesList } = useIssueSubTypes();
  const { issueSubComponentsList } = useIssueSubComponents();

  // FETCH ISSUE COMPONENT

  useEffect(() => {
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
  }, []);

  const customStyles = styles();
  return (
    <SafeAreaView style={customStyles.container}>
      <Content
        stepOneParams={params.stepOneParams}
        issueCategories={issueCategoriesList}
        issueTypes={issueTypesList}
        issueSubTypes={issueSubTypesList}
        issueComponents={issueComponents}
        issueSubComponents={issueSubComponentsList}
      />
    </SafeAreaView>
  );
};

export default CitizenReportStep2;

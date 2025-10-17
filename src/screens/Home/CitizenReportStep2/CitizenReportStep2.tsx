import React from 'react';
import { SafeAreaView } from 'react-native';
import { useIssueCategories } from "../../../hooks/issues/useIssueCategories";
import { useIssueComponents } from '../../../hooks/issues/useIssueComponents';
import { useIssueSubComponents } from '../../../hooks/issues/useIssueSubComponents';
import { useIssueSubTypes } from '../../../hooks/issues/useIssueSubTypes';
import { useIssueTypes } from "../../../hooks/issues/useIssueTypes";
import { styles } from './CitizenReportStep2.styles';
import Content from './containers/Content';

const CitizenReportStep2 = ({ route }) => {
  const { params } = route;
  const { issueCategoriesList, loading } = useIssueCategories();
  const { issueTypesList } = useIssueTypes();
  const { issueSubTypesList } = useIssueSubTypes();
  const { issueSubComponentsList } = useIssueSubComponents();
  const { issueComponentsList } = useIssueComponents();

  const customStyles = styles();
  return (
    <SafeAreaView style={customStyles.container}>
      <Content
        stepOneParams={params.stepOneParams}
        issueCategories={issueCategoriesList}
        issueTypes={issueTypesList}
        issueSubTypes={issueSubTypesList}
        issueComponents={issueComponentsList}
        issueSubComponents={issueSubComponentsList}
      />
    </SafeAreaView>
  );
};

export default CitizenReportStep2;

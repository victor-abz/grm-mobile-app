import React from 'react';
import { SafeAreaView } from 'react-native';
import { useIssueCategories } from '../../../hooks/issues/useIssueCategories';
import { useIssueComponents } from '../../../hooks/issues/useIssueComponents';
import { useIssueSubComponents } from '../../../hooks/issues/useIssueSubComponents';
import { useIssueSubTypes } from '../../../hooks/issues/useIssueSubTypes';
import { useIssueTypes } from '../../../hooks/issues/useIssueTypes';
import { styles } from './CitizenReportStep2.styles';
import Content from './containers/Content';
import { ActivityIndicator } from 'react-native-paper';
import { colors } from '../../../utils/colors';

const CitizenReportStep2 = ({ route }) => {
  const { params } = route;
  const { issueCategoriesList, loading: IssueCategoriesLoading } = useIssueCategories();
  const { issueTypesList, loading: IssueTypesLoading } = useIssueTypes();
  const { issueSubTypesList, loading: IssueSubTypesLoading } = useIssueSubTypes();
  const { issueSubComponentsList, loading: IssueSubComponentsLoading } = useIssueSubComponents();
  const { issueComponentsList, loading: IssueComponentsLoading } = useIssueComponents();

  const customStyles = styles();
  return (
    <SafeAreaView style={customStyles.container}>
      {IssueCategoriesLoading ||
      IssueTypesLoading ||
      IssueSubTypesLoading ||
      IssueSubComponentsLoading ||
      IssueComponentsLoading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" />
      ) : (
        <>
          <Content
            stepOneParams={params.stepOneParams}
            issueCategories={issueCategoriesList}
            issueTypes={issueTypesList}
            issueSubTypes={issueSubTypesList}
            issueComponents={issueComponentsList}
            issueSubComponents={issueSubComponentsList}
          />
        </>
      )}
    </SafeAreaView>
  );
};

export default CitizenReportStep2;

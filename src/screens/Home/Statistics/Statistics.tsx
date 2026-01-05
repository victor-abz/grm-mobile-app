import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import Content from './containers';
import { styles } from './Statistics.style';
import { colors } from '../../../utils/colors';
import { useIssueCategories } from '../../../hooks/issues/useIssueCategories';
import { useIssueTypes } from "../../../hooks/issues/useIssueTypes";
import { useIssueSubComponents } from '../../../hooks/issues/useIssueSubComponents';
import { useIssueComponents } from '../../../hooks/issues/useIssueComponents';
import { useIssueCitizenGroups } from '../../../hooks/issues/useCitizenGroups';
import { useIssueAges } from '../../../hooks/issues/useIssueAges';
import { useIssue } from '../../../hooks/issues/useIssue';
import type { Issue } from '../../../models/issues/Issue';


function Statistics() {
  const customStyles = styles();
  const { issueTypesList } = useIssueTypes();
  const { issueCategoriesList, loading: issueCategoriesLoading } = useIssueCategories();
  const { issueCitizenGroupsList, loading: issueCitizenGroupsLoading } = useIssueCitizenGroups();
  const { issueComponentsList, loading: issueComponentsLoading } = useIssueComponents();
  const { issueSubComponentsList, loading: issueSubComponentsLoading } = useIssueSubComponents();
  const { issueAgesList, loading: issueAgesLoading } = useIssueAges();

  const [issues, setIssues] = useState<Issue[]>();
  const { assigneeIssueList, reporterIssueList } = useIssue();
  
  useEffect(() => {
    if (assigneeIssueList && reporterIssueList) {
      const combined = [...assigneeIssueList, ...reporterIssueList];
      const uniqueIssues = Array.from(
        new Map(combined.map((issue) => [issue.id, issue])).values()
      );
      setIssues(uniqueIssues);
    }
  }, [assigneeIssueList, reporterIssueList]);

  if (
    !issues ||
    issueCategoriesLoading ||
    issueCitizenGroupsLoading ||
    issueComponentsLoading ||
    issueSubComponentsLoading ||
    issueAgesLoading
  )
    return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" />;
  
  return (
    <SafeAreaView style={customStyles.container}>
      <ScrollView>
        <Content
          issues={issues}
          ageGroup={issueAgesList}
          citizenGroup1={issueCitizenGroupsList}
          citizenGroup2={issueCitizenGroupsList}
          issueType={issueTypesList}
          issueCategory={issueCategoriesList}
          issueComponent={issueComponentsList}
          issueSubComponent={issueSubComponentsList}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

export default Statistics;

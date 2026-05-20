import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import Content from './containers';
import { styles } from './SearchBarGrm.style';
import { useIssue } from '../../../hooks/issues/useIssue';

function SearchBarGrm() {
  const [issues, setIssues] = useState();
  const { assigneeIssueList, reporterIssueList } = useIssue();

  useEffect(() => {
    if (assigneeIssueList && reporterIssueList) {
      const combined = [...assigneeIssueList, ...reporterIssueList];
      const uniqueIssues = Array.from(new Map(combined.map((issue) => [issue.id, issue])).values());
      setIssues(uniqueIssues);
    }
  }, [assigneeIssueList, reporterIssueList]);

  return (
    <SafeAreaView style={styles.container}>
      <Content issues={issues} />
    </SafeAreaView>
  );
}

export default SearchBarGrm;

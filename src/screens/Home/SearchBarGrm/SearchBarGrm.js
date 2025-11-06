import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import Content from './containers';
import { styles } from './SearchBarGrm.style';
import { LocalAdminLevelsDatabase, LocalGRMDatabase } from '../../../db/databaseManager';
import { useIssue } from '../../../hooks/issues/useIssue';

//fetch issues: is assigne + is reporter
// having the eadl here might not be necessary to filter issues, because 
// available issues are now from the authenticated user (check for other similar cases)

function SearchBarGrm() {
  const [issues, setIssues] = useState();  
  const { assigneeIssueList, reporterIssueList} = useIssue()

  useEffect(() => {
    if (assigneeIssueList && reporterIssueList) {
      const combined = [...assigneeIssueList, ...reporterIssueList];
      const uniqueIssues = Array.from(
        new Map(combined.map(issue => [issue.id, issue])).values()
      );
      setIssues(uniqueIssues);
    }
  }, [assigneeIssueList, reporterIssueList]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Content issues={issues} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default SearchBarGrm;

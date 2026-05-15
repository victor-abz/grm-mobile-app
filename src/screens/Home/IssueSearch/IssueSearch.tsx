import React from 'react';
import { ActivityIndicator, SafeAreaView } from "react-native";
import Content from './containers';
import { styles } from './IssueSearch.style';
import { useIssueStatus } from '../../../hooks/issues/useIssueStatus';

import { useIssue } from '../../../hooks/issues/useIssue';
import { useSelector } from 'react-redux';
import IssuesList from "../shared/IssuesList";

function IssueSearch() { 
  const customStyles = styles();
   const {
    assigneeIssueList,
    reporterIssueList,
    loading,
  } = useIssue();

   if (loading) return <ActivityIndicator style={[{ marginTop: 10 }]}/>;

  return (
    <>
      <IssuesList
        assigneeIssueList={assigneeIssueList}
        reporterIssueList={reporterIssueList}
      />
    </>
  );
}

export default IssueSearch;

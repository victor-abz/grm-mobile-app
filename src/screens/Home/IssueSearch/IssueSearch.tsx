import React from 'react';
import { ActivityIndicator } from "react-native";

import { useIssue } from '../../../hooks/issues/useIssue';
import IssuesList from "../shared/IssuesList";

function IssueSearch() { 
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

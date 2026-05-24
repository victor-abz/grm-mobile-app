import React, { useEffect, useState } from "react";
import { ActivityIndicator } from 'react-native-paper';
import SearchBar from '../components/SearchBar';
import IssuesList from "../../shared/IssuesList";
import { useIssue } from "../../../../hooks/issues/useIssue";

function Content() {
   const [searchPhrase, setSearchPhrase] = useState(null);
  const [clicked, setClicked] = useState(false);
  const {
    assigneeIssueList,
    reporterIssueList,
    loading,
    fetchTrackingCodeIssueList
  } = useIssue();

  useEffect(() => {
    if (searchPhrase && searchPhrase.length > 3) {
      fetchTrackingCodeIssueList(searchPhrase);
    } else if (!searchPhrase) {
      fetchTrackingCodeIssueList(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchPhrase]);

  useEffect(() => {
    setSearchPhrase(null);
    fetchTrackingCodeIssueList(searchPhrase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clicked]);

  if (loading) return <ActivityIndicator style={[{ marginTop: 10 }]} />;

  return (
    <>
      <SearchBar
        searchPhrase={searchPhrase}
        setSearchPhrase={setSearchPhrase}
        clicked={clicked}
        setClicked={setClicked}
      />
      <IssuesList
        assigneeIssueList={assigneeIssueList}
        reporterIssueList={reporterIssueList}
      />
    </>
  );
}

export default Content;

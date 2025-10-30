import React, { useState } from "react";
import { StyleSheet, SafeAreaView, View, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { colors } from "../../../utils/colors";
import { useDatabase } from '@nozbe/watermelondb/react';
import { syncServiceInstance } from "../../../services/shared/SyncService";

export function Diagnostics() {
  // const {issueCategoriesList, loading} = useIssueCategories()
  // const {issueTypesList } = useIssueTypes()
  const [_issue, _setIssue] = useState();

  
  const database = useDatabase();
  // const {issueStatusList, loading} = useIssueStatus()
  const styles = StyleSheet.create({
    form: { flex: 1, justifyContent: "center", alignItems: "center" },
    input: {
      marginBottom: 10,
    },
  });

  const Issue = (issue) => (
    <View>
      <Text>{JSON.stringify(issue)}</Text> 
    </View>
  );

  // const enhance = withObservables([TABLE_NAMES.issue], ({ issue }) => ({
  //   issue: issue.observe(),
    
  // }));
  // const enhance = withObservables([TABLE_NAMES.issue], ({ issue }) => ({issue}));

  // const EnhancedIssue = enhance(Issue)

  // useEffect(() => {
  //   const dbInstance = syncServiceInstance.database;
  //   fetch(`${config.API_AUTH_BASE_URL}/authentication/login/`)
  //     .then((response) => response.json())
  //     .then((a) => a)
  //     .catch((error) => ({ error }));
    
  //   const subscription = dbInstance.get('issue').query().observe().subscribe(_setIssue);

  //   return () => subscription.unsubscribe();

  // }, [])

  // if (loading) {
  //   return <View><Text>Loading...</Text></View>
  // }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.form}>

        <Text style={{ color: colors.primary, fontWeight: "bold" }}>
          Upcoming feature.
        </Text>

        <TouchableOpacity onPress={() =>
        {
          // syncServiceInstance.syncAll();
          // const dbInstance = syncServiceInstance.database;
          console.log('DIAGNOSTICS DEBUG WATERMELON ');
          database
            .get('issue_status')
            .query()
            .fetch()
            .then((data) => {
              console.log('UPDATED ITEM FROM WATERMELON ', data);
            });
        }}>
          <Text style={{ color: colors.primary, fontWeight: "bold" }}>
            Press to test DB Sync {_issue}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() =>
        {
          // syncServiceInstance.syncAll();
          // const dbInstance = syncServiceInstance.database;
          syncServiceInstance.syncAll()
        }}>
          <Text style={{ color: colors.primary, fontWeight: "bold" }}>
            Press to syncAll()
          </Text>
        </TouchableOpacity>
        <Text style={{ color: colors.primary, fontWeight: "bold" }}>
          {/* {issueCategoriesList ? JSON.stringify(issueCategoriesList) : ""} */}
          {/* {issueStatusList ? JSON.stringify(issueStatusList) : ""} */}
        </Text>
      </View>
    </SafeAreaView>
  );
}

export default Diagnostics;

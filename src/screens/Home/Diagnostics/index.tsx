import React, { useState } from "react";
import { StyleSheet, SafeAreaView, View } from "react-native";
import { Text } from "react-native-paper";
import { colors } from "../../../utils/colors";
import { useDatabase } from '@nozbe/watermelondb/react';
import { syncServiceInstance } from "../../../services/shared/SyncService";
import { TouchableOpacity } from "react-native";
import { Q } from "@nozbe/watermelondb";
import { databaseServiceInstance } from "../../../utils/storageManager";

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
    
  //
  //   const subscription = dbInstance.get('issue').query(query).observe().subscribe(_setIssue);

  //   return () => subscription.unsubscribe();

  // }, [])

  const makeQuery = async () =>
  {
    const query = Q.where('intake_date', Q.gte('2026-02-11T14:21:11.343000Z'));
    console.log(
      await databaseServiceInstance.database.get('issue').query(query).fetchIds()
      // [
      //   ('571',
      //   '572',
      //   '573',
      //   '574',
      //   '575',
      //   '576',
      //   '577',
      //   '578',
      //   '579',
      //   '580',
      //   '581',
      //   '582',
      //   '583',
      //   '584',
      //   '585',
      //   '586',
      //   '587',
      //   '588',
      //   '589',
      //   '590')
      // ]
    );
    
  }

  // if (loading) {
  //   return <View><Text>Loading...</Text></View>
  // }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.form}>
        <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Upcoming feature.</Text>
        <View>
          {/* <TouchableOpacity onPress={makeQuery} ><Text>Make Query§</Text></TouchableOpacity> */}
        </View>
      </View>
    </SafeAreaView>
  );
}

export default Diagnostics;

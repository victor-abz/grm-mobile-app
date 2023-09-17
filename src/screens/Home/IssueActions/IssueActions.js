import React from 'react';
import { SafeAreaView, ScrollView, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useFind } from 'use-pouchdb';
import { styles } from './IssueActions.styles';
import Content from './containers/Content';

function IssueActions({ route, navigation }) {
  const { params } = route;
  const customStyles = styles();
  const { username } = useSelector((state) => state.get('authentication').toObject());

  const { docs: statuses, loading: statusesLoading } = useFind({
    selector: {
      type: 'issue_status',
    },
    db: 'LocalGRMDatabase',
  });

  const { docs: eadl, loading: eadlLoading } = useFind({
    selector: { 'representative.email': username },
    db: 'LocalDatabase',
  });

  return (
    <SafeAreaView style={customStyles.container}>
      {statusesLoading || eadlLoading || !eadl?.[0]?._id || !statuses ? (
        <ScrollView
          style={{
            backgroundColor: 'white',
            flex: 1,
          }}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View
            style={{
              zIndex: 20,
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator size="large" color="#24c38b" />
          </View>
        </ScrollView>
      ) : (
        <Content eadl={eadl?.[0]} issue={params.item} navigation={navigation} statuses={statuses} />
      )}
    </SafeAreaView>
  );
}

export default IssueActions;

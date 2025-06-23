import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import dataManager from '../../../services/DataManager';
import { styles } from './IssueActions.styles';
import Content from './containers/Content';

function IssueActions({ route, navigation }) {
  const { params } = route;
  const customStyles = styles();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState([]);
  const [eadl, setEadl] = useState(null);

  const { username } = useSelector((state) => state.get('authentication').toObject());

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load statuses from DataManager
        const statusData = await dataManager.getIssueStatuses();
        setStatuses(statusData);

        // TODO: Implement representative/eadl data loading with DataManager
        console.warn(
          'IssueActions - TODO: Implement representative/eadl data loading with DataManager'
        );

        // Placeholder eadl data - this needs to be implemented
        const eadlData = {
          _id: 'placeholder',
          representative_email: username,
          // TODO: Load actual representative data
        };
        setEadl(eadlData);
      } catch (error) {
        console.error('Error loading IssueActions data:', error);
        // Set empty data to prevent crashes
        setStatuses([]);
        setEadl({ _id: 'error', representative_email: username });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [username]);

  return (
    <SafeAreaView style={customStyles.container}>
      {loading || !eadl?._id || !statuses ? (
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
        <Content eadl={eadl} issue={params.item} navigation={navigation} statuses={statuses} />
      )}
    </SafeAreaView>
  );
}

export default IssueActions;

import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useData } from '../../../providers/DataProvider';
import { getIssues, getIssueStatuses } from '../../../utils/databaseManager';
import { colors } from '../../../utils/colors';
import { styles } from './IssueSearch.style';
import Content from './containers';

function IssueSearch() {
  const customStyles = styles();
  const { username } = useSelector((state) => state.get('authentication').toObject());
  const { isDataInitialized } = useData();

  const [issues, setIssues] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [eadl, setEadl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!isDataInitialized) return;

      try {
        setLoading(true);

        // Load issues and statuses using the new DataManager
        const [issuesData, statusesData] = await Promise.all([getIssues(), getIssueStatuses()]);

        setIssues(issuesData);
        setStatuses(statusesData);

        // For now, create a mock eadl object based on username
        // This should be replaced with proper user data from Frappe
        setEadl({
          _id: username,
          email: username,
          name: username,
        });
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isDataInitialized, username]);

  if (!isDataInitialized || loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" />;
  }

  return (
    <SafeAreaView style={customStyles.container}>
      <Content issues={issues} eadl={eadl} statuses={statuses} />
    </SafeAreaView>
  );
}

export default IssueSearch;

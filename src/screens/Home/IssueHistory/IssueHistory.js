import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { styles } from './IssueHistory.styles';
import Content from './containers/Content';

function IssueHistory({ route }) {
  const { params } = route;
  const customStyles = styles();
  const [issue, setIssue] = useState();

  useFocusEffect(
    React.useCallback(() => {
      setIssue({ ...params.item });
      return () => {};
    }, [params])
  );

  if (!issue)
    return <ActivityIndicator style={{ paddingTop: '40%' }} size="small" color="#24c38b" />;
  return (
    <SafeAreaView style={customStyles.container}>
      <Content issue={issue} />
    </SafeAreaView>
  );
}

export default IssueHistory;

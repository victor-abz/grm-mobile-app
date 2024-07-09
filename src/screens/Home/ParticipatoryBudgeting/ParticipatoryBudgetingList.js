import React from 'react';
import { ActivityIndicator, SafeAreaView } from 'react-native';
import { useSelector } from 'react-redux';
import { colors } from '../../../utils/colors';
import { styles } from './ParticipatoryBudgetingList.styles';
import Content from './containers/Content';

function ParticipatoryBudgetingList() {
  const customStyles = styles();
  const { username } = useSelector((state) => state.get('authentication').toObject());

  const { rows: representative, loading: eadlLoading } = useView('eadl/by_representative_email', {
    key: username,
    include_docs: true,
    db: 'LocalCommunesDatabase',
  });

  const eadl = representative.map((d) => d.doc);

  return (
    <SafeAreaView style={customStyles.container}>
      {eadlLoading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="large" />
      ) : (
        <Content eadl={eadl?.[0]} />
      )}
    </SafeAreaView>
  );
}
export default ParticipatoryBudgetingList;

import React from 'react';
import { ActivityIndicator, SafeAreaView } from 'react-native';
import { useSelector } from 'react-redux';
import { useFind } from 'use-pouchdb';
import { colors } from '../../../utils/colors';
import { styles } from './ParticipatoryBudgetingList.styles';
import Content from './containers/Content';

function ParticipatoryBudgetingList() {
  const customStyles = styles();
  // const [eadl, setEadl] = useState();
  const { username } = useSelector((state) => state.get('authentication').toObject());

  const { docs: eadl, loading: eadlLoading } = useFind({
    selector: { 'representative.email': username },
    db: 'LocalDatabase',
  });

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

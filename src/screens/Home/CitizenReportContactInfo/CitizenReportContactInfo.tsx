import { SafeAreaView, Text } from 'react-native';
import { useIssueAges } from '../../../hooks/issues/useIssueAges';
import { styles } from './CitizenReportContactInfo.styles';
import Content from './containers/Content';
import { useIssueCitizenGroups } from '../../../hooks/issues/useCitizenGroups';
import { ActivityIndicator } from 'react-native-paper';
import { colors } from '../../../utils/colors';

const CitizenReportContactInfo = ({ route }) => {
  const customStyles = styles();
  const { params } = route;
  const { issueAgesList, loading: agesLoading } = useIssueAges();
  const { issueCitizenGroupsList, loading: citizenGroupsLoading } = useIssueCitizenGroups();

  return (
    <SafeAreaView style={customStyles.container}>
      {agesLoading || citizenGroupsLoading ? <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" /> : 
     <>
        <Content
          stepOneParams={params.stepOneParams}
          issueAges={issueAgesList}
          citizenGroups={issueCitizenGroupsList}
        />
     </>
      }
    </SafeAreaView>
  );
};
export default CitizenReportContactInfo;

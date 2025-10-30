import { useEffect, useState } from 'react';
import { SafeAreaView, Text } from 'react-native';
import { LocalGRMDatabase } from '../../../db/databaseManager';
import { useIssueAges } from '../../../hooks/issues/useIssueAges';
import { styles } from './CitizenReportContactInfo.styles';
import Content from './containers/Content';
import { useIssueCitizenGroups } from '../../../hooks/issues/useCitizenGroups';

const CitizenReportContactInfo = ({ route }) => {
  const customStyles = styles();
  const { params } = route;
  const { issueAgesList } = useIssueAges();
  // const [ citizenGroups, setCitizenGroups ] = useState();
  // const [ citizenGroupsII, setCitizenGroupsII ] = useState();

  const { issueCitizenGroupsList } = useIssueCitizenGroups();
  // const { citizenGroupsII } = useCitizenGroupsII()

  // useEffect(() => {
  //   //FETCH CITIZEN GROUP 1
  //   LocalGRMDatabase.find({
  //     selector: { type: 'issue_citizen_group' },
  //   })
  //     .then(function (result) {
  //       setCitizenGroups(result?.docs);
  //     })
  //     .catch(function (err) {
  //       console.log(err);
  //     });

  //   //FETCH CITIZEN GROUP 2
  //   LocalGRMDatabase.find({
  //     selector: { type: 'issue_citizen_group_2' },
  //   })
  //     .then(function (result) {
  //       setCitizenGroupsII(result?.docs);
  //     })
  //     .catch(function (err) {
  //       console.log(err);
  //     });
  // }, []);

  return (
    <SafeAreaView style={customStyles.container}>
      <Content
        stepOneParams={params.stepOneParams}
        issueAges={issueAgesList}
        citizenGroupsII={[]}
        citizenGroups={issueCitizenGroupsList}
      />
    </SafeAreaView>
  );
};
export default CitizenReportContactInfo;

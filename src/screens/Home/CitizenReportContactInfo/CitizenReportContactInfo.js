import React, {useEffect, useState} from "react";
import { SafeAreaView } from "react-native";
import Content from "./containers/Content";
import { styles } from "./CitizenReportContactInfo.styles";
import {LocalGRMDatabase} from "../../../utils/databaseManager";

const CitizenReportContactInfo = ({ route }) => {
  const customStyles = styles();
  const { params } = route;
  const [issueAges, setIssueAges] = useState();
  const [citizenGroups, setCitizenGroups] = useState();
  const [citizenGroupsII, setCitizenGroupsII] = useState();


  useEffect(() => {
    //FETCH ISSUE AGE GROUP
    LocalGRMDatabase.find({
      selector: { type: "issue_age_group" },
    })
        .then(function (result) {
          setIssueAges(result?.docs);
        })
        .catch(function (err) {
          console.log("issue_age error :" + err);
        });
    //FETCH CITIZEN GROUP 1
    LocalGRMDatabase.find({
      selector: { type: "issue_citizen_group" },
    })
        .then(function (result) {
          setCitizenGroups(result?.docs);
        })
        .catch(function (err) {
          console.log(err);
        });
    //FETCH CITIZEN GROUP 2
    LocalGRMDatabase.find({
      selector: { type: "issue_citizen_group_2" },
    })
        .then(function (result) {
          setCitizenGroupsII(result?.docs);
        })
        .catch(function (err) {
          console.log(err);
        });
  }, []);

  return (
    <SafeAreaView style={customStyles.container}>
      <Content
          stepOneParams={params.stepOneParams}
          issueAges={issueAges}
          citizenGroupsII={citizenGroupsII}
          citizenGroups={citizenGroups}
      />
    </SafeAreaView>
  );
};

export default CitizenReportContactInfo;

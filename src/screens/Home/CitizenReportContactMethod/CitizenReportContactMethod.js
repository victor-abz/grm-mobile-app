import React from "react";
import { SafeAreaView } from "react-native";
import Content from "./containers/Content";
import { styles } from "./CitizenReportContactMethod.styles";

const CitizenReportContactMethod = () => {
  const customStyles = styles();

  return (
    <SafeAreaView style={customStyles.container}>
      <Content />
    </SafeAreaView>
  );
};

export default CitizenReportContactMethod;

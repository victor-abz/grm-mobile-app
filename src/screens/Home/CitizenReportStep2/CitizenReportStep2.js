import React from 'react';
import { SafeAreaView } from 'react-native';
import { styles } from './CitizenReportStep2.styles';
import Content from './containers/Content';

function CitizenReportStep2({ route }) {
  const { params } = route;

  const customStyles = styles();
  return (
    <SafeAreaView style={customStyles.container}>
        <Content
          stepOneParams={params.stepOneParams}
        //   issueCategories={issueCategories}
        //   issueTypes={issueTypes}
        //   issueSubTypes={issueSubTypes}
        //   issueComponents={issueComponents}
        //   issueSubComponents={issueSubComponents}
        />
    </SafeAreaView>
  );
}

export default CitizenReportStep2;

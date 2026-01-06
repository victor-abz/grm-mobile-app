import React from "react";
import { SafeAreaView } from "react-native";
import Content from "./containers/Content";
import { styles } from "./IssueDetail.styles";
import { useIssueAttachments } from "../../../hooks/issues/useIssueAttachments";

const IssueDetail = ({ route }) => {
  const { params } = route;
  const { issueAttachmentsList, refetchAttachment } = useIssueAttachments(params.item.id);
  const customStyles = styles();

  return (
    <SafeAreaView style={customStyles.container}>
      <Content
        issue={params.item}
        attachments={issueAttachmentsList}
        refetchAttachment={refetchAttachment}
      />
    </SafeAreaView>
  );
};

export default IssueDetail;

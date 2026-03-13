import React from "react";
import { View, ScrollView, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import SmallCard from "../components/SmallCard";
import BigCard from "../components/BigCard";
import Chart from "../../../../../assets/chart_line_solid.svg";
import FileIcon from "../../../../../assets/file_alt_regular.svg";
import TeamWorkIcon from "../../../../../assets/team-work.svg";
import SyncIcon from "../../../../../assets/sync_alt_solid.svg";
import { i18n } from "../../../../translations/i18n";
import { useIssue } from "../../../../hooks/issues/useIssue";
import { useIssueAttachments } from "../../../../hooks/issues/useIssueAttachments";
import { useSelector } from "react-redux";
import { ConfidentialityChoices } from "../../../../utils/constants";
import { syncServiceInstance } from "../../../../services/shared/SyncService";

const SAMPLE_WORDS = ['lac', 'plaine', 'savane', 'colline'];

const retrieveIssue = (session, profile) =>
{
  const randomWord = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randomCodeNumber = Math.floor(Math.random() * 1000);

  const issue = {
    typeOfPerson: 'anonymous',
    methodOfContact: 'phone_number',
    contactInfo: '',
    name: '2',
    ageGroup: {
      id: 1,
      name: 'age group 1',
      created_date: '2025-09-09T14:47:33.875402Z',
      updated_date: '2025-09-09T14:47:33.877173Z',
    },
    citizen_type: 'keep_name_confidential',
    citizen_group: 1,
    gender: 'male',
    filledOnSomebodyElseBehalf: false,
    issue_date: '2025-12-29T14:45:15.756Z',
    issueType: {
      id: 1,
      name: 'type 1',
      created_date: '2025-09-09T14:47:33.941902Z',
      updated_date: '2025-09-09T14:47:33.944237Z',
    },
    issueSubType: {
      id: 1,
      name: 'Sample sub type',
      created_date: '2025-09-09T14:47:33.941000Z',
      updated_date: '2025-09-09T14:47:33.941000Z',
      parent: {
        id: 1,
        name: 'type 1',
        created_date: '2025-09-09T14:47:33.941902Z',
        updated_date: '2025-09-09T14:47:33.944237Z',
      },
    },
    issueComponent: {
      id: 1,
      name: 'sample component',
      description: 'sample description component',
      created_date: '2025-09-09T14:47:33.898748Z',
      updated_date: '2025-09-09T14:47:33.901478Z',
    },
    issueSubComponent: {
      id: 1,
      name: 'Sample subcomponent',
      description: 'no description',
      created_date: '2025-09-09T14:47:33.947628Z',
      updated_date: '2025-09-09T14:47:33.950213Z',
      parent: {
        id: 1,
        name: 'sample component',
        description: 'sample description component',
        created_date: '2025-09-09T14:47:33.898748Z',
        updated_date: '2025-09-09T14:47:33.901478Z',
      },
    },
    ongoingEvent: false,
    attachment: {
      url: '',
      id: '2025-12-29T14:45:30.221Z',
      uploaded: false,
      local_url:
        'file:///data/user/0/com.setcobj.grmapp/files/issues/523/attachments/2FEKdxpPVuiSnCBxBdvTK6.jpg',
      name: '2FEKdxpPVuiSnCBxBdvTK6.jpg',
    },

    recording: {
      url: '',
      id: 'recording-600bb53c-41e7-4399-901b-6b904607216e.3gp',
      uploaded: false,
      local_url:
        'file:///data/user/0/com.setcobj.grmapp/files/issues/523/attachments/2f5kMtRmEosHp2jeLdTHDs.3gp',
      isAudio: true,
      name: '2f5kMtRmEosHp2jeLdTHDs.3gp',
    },
    category: {
      id: 3,
      name: 'La réinstallation des populations si nécessaire',
      confidentiality_level: '',
      assigned_department: 1,
      administrative_level: 'country',
    },
    additionalDetails: 't',
    issueLocation: {
      id: 374,
      name: 'ZÉMBOUGOU-BÉRI',
      administrative_id: 374,
      created_date: '2025-09-09T14:47:33.864791Z',
      updated_date: '2025-09-09T14:47:33.868697Z',
    },
    locationDescription: '4',
    status: {
      id: 2,
      name: 'Ouverte',
      final_status: false,
      initial_status: false,
      rejected_status: false,
      open_status: true,
      created_date: '2025-09-09T14:47:33.930776Z',
      updated_date: '2025-09-09T14:47:33.933821Z',
    },
  };
  
  const issueSample = {
    tracking_code: `${randomWord(SAMPLE_WORDS)}${randomCodeNumber}`,
    title: 'Sample title',
    description: 'sample description',
    attachments: [
      ...(issue?.attachment ? [issue.attachment] : []),
      ...(issue?.recording ? [issue.recording] : []),
    ],
    status: issue.status,
    reporter: { id: session.user_id, name: profile?.user?.name },
    // citizen_age_group: issue.ageGroup,
    // citizen: issue.name ?? '',
    citizen: {
      name: issue.name ?? '',
      age_group: undefined,
      type: ConfidentialityChoices.CONFIDENTIAL,
      group: undefined,
      group_2: undefined,
    },
    contact_medium: issue.typeOfPerson,
    citizen_type: issue.citizen_type,
    citizen_group: issue.citizen_group,
    citizen_group_2: issue.citizen_group_2,
    location_description: issue.locationDescription, //e.g. pasó en la esquina de la calle frank 19
    administrative_region: issue.issueLocation,
    category: issue.category,
    issue_type: issue.issueType,
    issue_sub_type: issue.issueSubType,
    component: issue.issueComponent,
    sub_component: issue.issueSubComponent,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    resolution_days: 0,
    resolution_date: '',
    intake_date: new Date().toISOString(),
    issue_date: issue.issue_date,
    ongoing_issue: issue.ongoingEvent,
    comments: [],
    contact_method: issue.methodOfContact,
    contact_information: issue.contactInfo,
  };
  
  return issueSample
  
}


function Content() {
  const navigation = useNavigation();
  const { createIssue } = useIssue(false);
  const { createAttachment } = useIssueAttachments();

  const { session, profile } = useSelector((state) => state.get('authentication').toObject());
  

 
  const submitIssue = async () =>
  { 
    try {
      const issue = retrieveIssue(session, profile);
      const createdIssue = await createIssue(issue);
      
      if (issue.attachments) {
        for (let index = 0; index < issue.attachments.length; index++) {
          const element = issue.attachments[index];
          console.log("33333333",element.local_url);
          
           await createAttachment({
             file_name: element.name,
             is_audio: element.isAudio,
             local_url: element.local_url,
             url: '',
             parent_id: createdIssue.id,
             id: '',
             created_date: '',
             name: element.name,
           });
        }
      }       
     } catch (error) {
       console.error(error);
     }
  }

  return (
    <ScrollView contentContainerStyle={{ paddingTop: 20 }} style={{ backgroundColor: 'white' }}>
      {/* <BigCard
        image={require("../../../../../assets/BG_9.png")}
        onCardPress={() => syncServiceInstance.syncAll()}
        title={"Sync All"}
        icon={<TeamWorkIcon />}
      /><BigCard
        image={require("../../../../../assets/BG_9.png")}
        onCardPress={() => submitIssue()}
        title={"Create Issue"}
        icon={<TeamWorkIcon />}
      />

      <Text style={{textAlign: 'center', alignItems: 'center'}}>==== Remove Card from Above =====</Text> */}
      
      <BigCard
        image={require('../../../../../assets/BG_9.png')}
        onCardPress={() => navigation.navigate('CitizenReportIntro')}
        title={i18n.t('collect_reports')}
        icon={<TeamWorkIcon />}
      />
      <View style={{ marginVertical: 20 }}>
        <BigCard
          image={require('../../../../../assets/purpleBg.png')}
          onCardPress={() => navigation.navigate('IssueSearch')}
          title={i18n.t('search_reports')}
          icon={<SyncIcon />}
        />
      </View>
      <BigCard
        image={require('../../../../../assets/small-rectangle.png')}
        onCardPress={() => navigation.navigate('SyncAttachments')}
        title={i18n.t('sync_files')}
        icon={<SyncIcon />}
        // cardHeight={79}
      />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-evenly',
          marginVertical: 20,
          borderRadius: 15,
        }}
      >
        <SmallCard
          image={require('../../../../../assets/BG_1.png')}
          onCardPress={() => navigation.navigate('Statistics')}
          title={i18n.t('diagnostics')}
          icon={<Chart />}
        />
        <SmallCard
          image={require('../../../../../assets/BG_2.png')}
          onCardPress={() => alert('Upcoming feature')}
          title={i18n.t('information')}
          icon={<FileIcon />}
        />
      </View>

      {/*<ReactNativeSwipeableViewStack*/}
      {/*  // onSwipe={(swipedIndex) => this.onCardSwipe(swipedIndex)}*/}
      {/*  initialSelectedIndex={1}*/}
      {/*  data={[0, 1, 2, 3, 4, 5]}*/}
      {/*  useNativeDrive={true}*/}
      {/*  stackSpacing={Platform.OS === "ios" ? 30 : 20}*/}
      {/*  onItemClicked={() => console.log("click")}*/}
      {/*  pointerEvents="none"*/}
      {/*  renderItem={(element) => (*/}
      {/*    <Card*/}
      {/*      pointerEvents="none"*/}
      {/*      style={{*/}
      {/*        width: screenWidth * 0.888,*/}
      {/*        alignSelf: "center",*/}
      {/*        borderRadius: 15,*/}
      {/*        backgroundColor: "white",*/}
      {/*        padding: 19,*/}
      {/*      }}*/}
      {/*    >*/}
      {/*      <Headline*/}
      {/*        style={{*/}
      {/*          color: "#707070",*/}
      {/*          fontWeight: "500",*/}
      {/*        }}*/}
      {/*      >*/}
      {/*        Prochaine tâche*/}
      {/*      </Headline>*/}
      {/*      <Paragraph*/}
      {/*        style={{*/}
      {/*          color: "#707070",*/}
      {/*        }}*/}
      {/*      >*/}
      {/*        Lorem Ipsum is simply dummy text of the printing and typesetting*/}
      {/*        industry. Lorem Ipsum has been the industry’s standard dummy text*/}
      {/*        ever since the 1500s.*/}
      {/*      </Paragraph>*/}
      {/*      <Button*/}
      {/*        onPress={() => alert("hey")}*/}
      {/*        style={{*/}
      {/*          alignSelf: "flex-end",*/}
      {/*          backgroundColor: "#24c38b",*/}
      {/*          width: 115,*/}
      {/*          marginTop: 20,*/}
      {/*          borderRadius: 7,*/}
      {/*          padding: 5,*/}
      {/*        }}*/}
      {/*        labelStyle={{*/}
      {/*          color: "white",*/}
      {/*        }} */}
      {/*      >*/}
      {/*        Tâches*/}
      {/*      </Button>*/}
      {/*    </Card>*/}
      {/*  )}*/}
      {/*/>*/}
    </ScrollView>
  );
}

export default Content;

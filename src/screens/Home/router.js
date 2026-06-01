import React from "react";

import { version } from '../../../package.json';
import { Platform, View, StyleSheet, Pressable, Text } from "react-native";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import posed from 'react-native-pose';
import { Feather, Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import WorkInProgress from './WorkInProgress';
import Notifications from './Notifications';
import ParticipatoryBudgetingList from './ParticipatoryBudgeting/ParticipatoryBudgetingList';
import PhaseTasks from './PhaseTasks/PhaseTasks';
import DocumentTask from './DocumentTask/DocumentTask';
import Statistics from './Statistics/Statistics';
import SyncAttachments from './SyncAttachments/SyncAttachments';
import RegisterSubprojects from './RegisterSubprojects/RegisterSubprojects';
import RegisterVotesActivity from './RegisterVotesActivity/RegisterVotesActivity';
import BudgetAllocation from './BudgetAllocation/BudgetAllocation';
import BudgetLog from './BudgetLog/BudgetLog';
import GRM from './GRM/GRM';
import CitizenReportContactMethod from './CitizenReportContactMethod/CitizenReportContactMethod';
import CitizenReportStep2 from './CitizenReportStep2/CitizenReportStep2';
import CitizenReportStep3 from './CitizenReportStep3/CitizenReportStep3';
import CitizenReportStep4 from './CitizenReportStep4/CitizenReportStep4';
import IssueSearch from './IssueSearch/IssueSearch';
import CitizenReportContactInfo from './CitizenReportContactInfo/CitizenReportContactInfo';
import IssueDetail from './IssueDetail/IssueDetail';
import CitizenReportIntro from './CitizenReportIntro/CitizenReportIntro';
import { colors } from '../../utils/colors';
import { i18n } from "../../translations/i18n";
import CitizenReportLocationStep from './CitizenReportLocationStep/CitizenReportLocationStep';
import IssueActions from './IssueActions/IssueActions';
import IssueHistory from './IssueHistory/IssueHistory';
import Profile from './Profile/Profile';
import { Icon } from "react-native-elements";
import SearchBarGrm from './SearchBarGrm/SearchBarGrm';

const iconConfig = {
  focused: {
    x: 0,
    transition: { type: 'tween', ease: 'linear' },
  },
  unfocused: { x: 0 },
};

const customHeaderOptions = (label) => ({
  headerBackTitle: () => null,
  headerTintColor: '#00bc82',
  headerTitle: () => { return (<View>
          <View>
            <Text>{label}</Text>
            <Text style={{ color: colors.secondary, fontSize: 12, textAlign: "center" }}>
               v {version}
            </Text>
      </View>
  </View>)},
  headerTitleAllowFontScaling: true,
  headerTitleAlign: 'center',
  headerTitleStyle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 20,
    fontWeight: '500',
    fontStyle: 'normal',
    letterSpacing: 0,
    textAlign: 'left',
    color: '#373737',
  },
});

const customHeaderRightIcon = ({ navigation }) => ({
  headerRight: () => (
      <View style={styles.iconContainer}>
        <Pressable
          onPress={() => {
            navigation.navigate('SearchBarGrm')
          }}>
          <Icon type="ionicon" color={colors.primary} size={35}
                name={Platform.OS === "ios" ? "ios-search" : "search"}/>
        </Pressable>
      </View>
  )
});

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  icon: {
    paddingLeft: 10
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginRight: 25
  }
});

const Tab = createBottomTabNavigator();
const TopTab = createMaterialTopTabNavigator();
const AnimatedFeatherIcon = posed(Feather)(iconConfig);
const AnimatedIonicons = posed(Ionicons)(iconConfig);

const HomeStack = createStackNavigator();
const ProfileStack = createStackNavigator();
const NotificationsStack = createStackNavigator();

/**
 * Stack for GRM module (the main app features excluding Profile)
 */
function DashboardStackScreen() {
  return (
    <HomeStack.Navigator>
      {/* GRM Module */}
      <HomeStack.Screen
        name="GRM"
        options={
          ({ navigation, route }) => ({
          ...customHeaderOptions(i18n.t('label_grm')),
            ...customHeaderRightIcon({ navigation, route }),
        })
        }
        component={GRM}
      />
      <HomeStack.Screen
        name="CitizenReportIntro"
        component={CitizenReportIntro}
        options={({ navigation, route }) => customHeaderOptions(i18n.t('citizen_input_header'))}
      />
      <HomeStack.Screen
        name="CitizenReportContactMethod"
        component={CitizenReportContactMethod}
        options={({ navigation, route }) => customHeaderOptions(i18n.t('citizen_input_header'))}
      />
      <HomeStack.Screen
        name="CitizenReportContactInfo"
        component={CitizenReportContactInfo}
        options={({ navigation, route }) => customHeaderOptions(i18n.t('citizen_input_header'))}
      />
      <HomeStack.Screen
        name="CitizenReportStep2"
        component={CitizenReportStep2}
        options={({ navigation, route }) => customHeaderOptions(i18n.t('citizen_input_header'))}
      />
      <HomeStack.Screen
        name="CitizenReportLocationStep"
        component={CitizenReportLocationStep}
        options={({ navigation, route }) => customHeaderOptions(i18n.t('citizen_input_header'))}
      />
      <HomeStack.Screen
        name="CitizenReportStep3"
        component={CitizenReportStep3}
        options={({ navigation, route }) => customHeaderOptions(i18n.t('citizen_input_header'))}
      />
      <HomeStack.Screen
        name="CitizenReportStep4"
        component={CitizenReportStep4}
        options={({ navigation, route }) => customHeaderOptions(i18n.t('citizen_input_header'))}
      />
      <HomeStack.Screen
        name="IssueSearch"
        component={IssueSearch}
        options={({ navigation, route }) => customHeaderOptions(i18n.t('your_summary'))}
      />
      <HomeStack.Screen
        name="Statistics"
        component={Statistics}
        options={({ navigation, route }) => customHeaderOptions(i18n.t('diagnostics'))}
      />
      <HomeStack.Screen
        name="IssueDetailTabs"
        component={IssueDetailTabsStack}
        options={({ navigation, route }) => customHeaderOptions(i18n.t('grm_management'))}
      />
      <HomeStack.Screen
        name="RegisterSubprojects"
        component={RegisterSubprojects}
        options={({ navigation, route }) => customHeaderOptions('Engagement Citoyen')}
      />
      <HomeStack.Screen
        name="BudgetAllocation"
        component={BudgetAllocation}
        options={({ navigation, route }) => customHeaderOptions('Budgetisation')}
      />
      <HomeStack.Screen
        name="BudgetLog"
        component={BudgetLog}
        options={({ navigation, route }) => customHeaderOptions('Budget Log')}
      />
      <HomeStack.Screen
        name="RegisterVotesActivity"
        component={RegisterVotesActivity}
        options={({ navigation, route }) => customHeaderOptions('Enregistrer les votes')}
      />
      <HomeStack.Screen
        name="ParticipatoryBudgetingList"
        component={ParticipatoryBudgetingList}
        options={({ navigation, route }) => customHeaderOptions('Budget Participatif')}
      />
      <HomeStack.Screen
        name="PhaseTasks"
        component={PhaseTasks}
        options={({ navigation, route }) => customHeaderOptions('Phase Tasks')}
      />
      <HomeStack.Screen
        name="DocumentTask"
        component={DocumentTask}
        options={({ navigation, route }) => customHeaderOptions('Document Task')}
      />
      <HomeStack.Screen
        name="SyncAttachments"
        component={SyncAttachments}
        options={({ navigation, route }) => customHeaderOptions(i18n.t('sync_files'))}
      />
      <HomeStack.Screen
        name="SearchBarGrm"
        component={SearchBarGrm}
        options={({ navigation, route }) => customHeaderOptions(i18n.t('search'))}
      />
      {/* <HomeStack.Screen name="Details" component={WorkInProgress} /> */}
    </HomeStack.Navigator>
  );
}

/**
 * Stack for Profile screens.
 */
function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="Profile"
        options={
          ({ navigation, route }) => ({
          ...customHeaderOptions(i18n.t('label_grm')),
        })
        }
        component={Profile}
      />
    </ProfileStack.Navigator>
  );
}

function NotificationsStackScreen() {
  return (
    <NotificationsStack.Navigator>
      <NotificationsStack.Screen
        options={{
          headerShown: false,
          headerTitleStyle: {
            alignSelf: 'center',
            fontFamily: 'Poppins_500Medium',
          },
        }}
        name="Notifications"
        component={Notifications}
      />
      <NotificationsStack.Screen name="WorkInProgress" component={WorkInProgress} />
    </NotificationsStack.Navigator>
  );
}

function IssueDetailTabsStack(props) {
  const issue = props.route.params.item;
  const {updateIssue} = props.route.params;

  return (
    <TopTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarIndicatorStyle: { backgroundColor: colors.primary },
      }}
      initialRouteName="Actions"
     >
      <TopTab.Screen
        name="Actions"
        initialParams={{ item: issue, updateIssue }}
        options={{ tabBarLabel: i18n.t('actions') }}
        component={IssueActions}
      />
      <TopTab.Screen
        name="IssueDetail"
        initialParams={{ item: issue }}
        options={{ tabBarLabel: i18n.t('details') }}
        component={IssueDetail}
      />
      <TopTab.Screen
        name="History"
        initialParams={{ item: issue }}
        options={{ tabBarLabel: i18n.t('history') }}
        component={IssueHistory}
      />
    </TopTab.Navigator>
  );
}

/**
 * Root-level tab navigator.
 */
const RootTab = createBottomTabNavigator();

function AppRootNavigator() {
  return (
    <RootTab.Navigator
      tabBarOptions={{
        activeTintColor: colors.primary,
        inactiveTintColor: 'gray',
      }}
    >
      <RootTab.Screen
        name="Home"
        options={{
          headerShown: false,
          tabBarLabel: i18n.t('dashboard'),
          tabBarActiveTintColor: colors.primary,
          tabBarIcon: ({ focused, color, size }) => (
            <AnimatedFeatherIcon
              pose={focused ? 'focused' : 'unfocused'}
              name="home"
              size={size}
              color={color}
            />
          ),
        }}
        component={DashboardStackScreen}
      />
      <RootTab.Screen
        name="ProfileTab"
        options={{
          headerShown: false,
          tabBarLabel: i18n.t('profile'),
          tabBarActiveTintColor: colors.primary,
          tabBarIcon: ({ focused, color, size }) => (
            <AnimatedFeatherIcon
              pose={focused ? 'focused' : 'unfocused'}
              name="user"
              size={size}
              color={color}
            />
          ),
        }}
        component={ProfileStackScreen}
      />
    </RootTab.Navigator>
  );
}

export default AppRootNavigator;

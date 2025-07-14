import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { useTheme } from 'react-native-paper';
import { Transition } from 'react-native-pose';
import { styles } from './BottomTabNavigator.style';

const Tab = createBottomTabNavigator();

// Tab label component to avoid unstable nested components
const TabLabel = () => <Transition>{/* Commented out original label logic */}</Transition>;

const NavigationDrawerNavigator = ({ children }) => (
  <Tab.Navigator
    initialRouteName="Dashboard"
    screenOptions={() => ({
      tabBarLabel: TabLabel,
      tabBarLabelPosition: 'beside-icon',
      tabBarInactiveTintColor: 'black', // theme.primary,
      tabBarActiveTintColor: '#009460', // theme.primary,
      // tabBarActiveBackgroundColor: "#6639bf", // theme.primary,
      tabBarItemStyle: {
        ...styles.tabItemStyle,
      },
      tabBarStyle: {
        ...styles.tabComponentStyle,
      },
      tabBarLabelStyle: {
        ...styles.labelStyle,
      },
    })}
  >
    {children}
  </Tab.Navigator>
);
export default NavigationDrawerNavigator;

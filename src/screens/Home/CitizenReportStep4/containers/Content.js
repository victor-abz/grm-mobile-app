import { useBackHandler } from '@react-native-community/hooks';
import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, ScrollView, Text, View, ActivityIndicator } from 'react-native';
import { Button } from 'react-native-paper';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import watermelonManager from '../../../../database/watermelonManager';
import LockImage from '../../../../../assets/lock.svg';
import { colors } from '../../../../utils/colors';
import { styles } from './Content.styles';
import { enrichIssueData, createDetailLookupMaps } from '../../../../utils/issueDetailUtils';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: '#dedede',
    text: '#707070',
  },
};

const Content = ({
  route,
  navigation,
  issue,
  // Add lookup data for enrichment
  categories = [],
  types = [],
  statuses = [],
  ageGroups = [],
  citizenGroups = [],
  regions = [],
  projects = [],
  users = [],
}) => {
  const { t } = useTranslation();
  const { issueId, trackingCode } = route?.params || {};
  const [isLoading, setIsLoading] = useState(true);

  // Create lookup maps using shared utility for enriching issue data
  const lookupMaps = useMemo(() => {
    const lookupData = {
      categories,
      types,
      statuses,
      ageGroups,
      citizenGroups,
      regions,
      projects,
      users,
    };
    return createDetailLookupMaps(lookupData);
  }, [categories, types, statuses, ageGroups, citizenGroups, regions, projects, users]);

  // Extract the actual issue from the query result array and enrich it
  const actualIssue = useMemo(() => {
    const rawIssue = Array.isArray(issue) && issue.length > 0 ? issue[0] : null;
    if (!rawIssue) return null;

    // Use shared utility to enrich issue data with lookup labels
    return enrichIssueData(rawIssue, lookupMaps, t);
  }, [issue, lookupMaps, t]);

  console.log('🔍 [STEP4] Component rendered with:', {
    issueId,
    trackingCode,
    hasIssue: !!actualIssue,
    issueArray: issue,
    actualIssue: actualIssue
      ? {
          id: actualIssue.id,
          trackingCode: actualIssue.tracking_code || actualIssue.trackingCode,
          categoryLabel: actualIssue.categoryLabel,
          typeLabel: actualIssue.typeLabel,
          statusLabel: actualIssue.statusLabel,
        }
      : null,
    lookupMapsSize: {
      categories: lookupMaps.categoryMap?.size || 0,
      types: lookupMaps.typeMap?.size || 0,
      statuses: lookupMaps.statusMap?.size || 0,
    },
  });

  useBackHandler(
    () =>
      // navigation.navigate("GRM")
      // handle it
      true
  );

  // Effect to handle loading state and error detection
  useEffect(() => {
    let timeoutId;

    if (issueId) {
      console.log('🔍 [STEP4] Setting up loading timeout for issue:', issueId);

      // If issue is found, clear timeout and stop loading
      if (actualIssue) {
        console.log('✅ [STEP4] Issue loaded and enriched successfully:', {
          id: actualIssue.id,
          trackingCode: actualIssue.tracking_code || actualIssue.trackingCode,
          categoryLabel: actualIssue.categoryLabel,
          statusLabel: actualIssue.statusLabel,
        });
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    } else {
      console.log('🔍 [STEP4] No issueId provided in route params');
      setIsLoading(false);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [actualIssue, issueId]);

  // Show loading state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 50 }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, textAlign: 'center', color: '#666' }}>
          Loading issue details...
        </Text>
        <Text style={{ marginTop: 8, textAlign: 'center', color: '#999', fontSize: 12 }}>
          Issue ID: {issueId}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <View style={{ padding: 23 }}>
        <Text style={styles.stepText}>{t('step_6')}</Text>
        <Text style={styles.stepSubtitle}>{t('step_4_subtitle')}</Text>
        <Text style={styles.stepDescription}>{t('step_4_description')}</Text>
        <Text style={styles.stepDescription} />
        <Text style={styles.stepDescription}>{t('step_5_description')}</Text>
        <Text style={styles.stepDescription} />
        <Text style={styles.stepDescription}>{t('step_6_description')}</Text>
      </View>

      <LockImage
        style={{ alignSelf: 'center' }}
        height={screenHeight * 0.2}
        width={screenWidth * 0.5}
      />
      <Text style={[styles.stepSubtitle, { textAlign: 'center' }]}>{t('step_4_issue_code')}</Text>
      <Text
        style={{
          fontSize: 26,
          fontWeight: 'bold',
          textAlign: 'center',
          color: colors.primary,
          marginBottom: 40,
        }}
      >
        {actualIssue?.tracking_code}
      </Text>
      <View style={{ alignSelf: 'center' }}>
        {/* <View */}
        {/*  style={{ */}
        {/*    flexDirection: "row", */}
        {/*    justifyContent: "center", */}
        {/*    marginBottom: 23, */}
        {/*  }} */}
        {/* > */}
        {/*  <Button */}
        {/*    theme={theme} */}
        {/*    style={{ */}
        {/*      alignSelf: "center", */}
        {/*      marginRight: 7, */}
        {/*      backgroundColor: "#dedede", */}
        {/*    }} */}
        {/*    labelStyle={{ color: "white", fontFamily: "Poppins_500Medium" }} */}
        {/*    mode="contained" */}
        {/*    onPress={() => console.log("Pressed")} */}
        {/*  > */}
        {/*    {t("step_4_short_code")} */}
        {/*  </Button> */}
        {/*  <Button */}
        {/*    theme={theme} */}
        {/*    style={{ */}
        {/*      alignSelf: "center", */}
        {/*      marginLeft: 7, */}
        {/*      backgroundColor: "#dedede", */}
        {/*    }} */}
        {/*    labelStyle={{ color: "white", fontFamily: "Poppins_500Medium" }} */}
        {/*    mode="contained" */}
        {/*    onPress={() => console.log("Pressed")} */}
        {/*  > */}
        {/*    {t("step_4_two_word_code")} */}
        {/*  </Button> */}
        {/* </View> */}

        <Button
          theme={theme}
          labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
          mode="contained"
          onPress={() => navigation.navigate('GRM')}
        >
          {t('step_4_back_text')}
        </Button>
      </View>
    </ScrollView>
  );
};

// ✅ Enhanced withObservables with better error handling and proper route access
// Includes all lookup data for issue enrichment
const enhance = withObservables(['route'], ({ route }) => {
  console.log('🔍 [STEP4] withObservables called with route:', route);

  // Safety check for route and params
  if (!route || !route.params) {
    console.log('🔍 [STEP4] No route or params provided, returning empty observables');
    return {
      issue: watermelonManager
        .getDatabase()
        .get('grm_issues')
        .query(Q.where('id', 'none'))
        .observe(),
      // Include empty lookup data for consistency
      categories: watermelonManager.getDatabase().get('grm_issue_categories').query().observe(),
      types: watermelonManager.getDatabase().get('grm_issue_types').query().observe(),
      statuses: watermelonManager.getDatabase().get('grm_issue_statuses').query().observe(),
      ageGroups: watermelonManager.getDatabase().get('grm_issue_age_groups').query().observe(),
      citizenGroups: watermelonManager
        .getDatabase()
        .get('grm_issue_citizen_groups')
        .query()
        .observe(),
      regions: watermelonManager.getDatabase().get('grm_administrative_regions').query().observe(),
      projects: watermelonManager.getDatabase().get('grm_projects').query().observe(),
      users: watermelonManager.getDatabase().get('users').query().observe(),
    };
  }

  console.log('🔍 [STEP4] Route params:', route.params);

  const { issueId } = route.params;
  console.log('🔍 [STEP4] withObservables called with issueId:', issueId);

  if (!issueId) {
    console.log('🔍 [STEP4] No issueId provided, returning empty observables');
    return {
      issue: watermelonManager
        .getDatabase()
        .get('grm_issues')
        .query(Q.where('id', 'none'))
        .observe(),
      // Include empty lookup data for consistency
      categories: watermelonManager.getDatabase().get('grm_issue_categories').query().observe(),
      types: watermelonManager.getDatabase().get('grm_issue_types').query().observe(),
      statuses: watermelonManager.getDatabase().get('grm_issue_statuses').query().observe(),
      ageGroups: watermelonManager.getDatabase().get('grm_issue_age_groups').query().observe(),
      citizenGroups: watermelonManager
        .getDatabase()
        .get('grm_issue_citizen_groups')
        .query()
        .observe(),
      regions: watermelonManager.getDatabase().get('grm_administrative_regions').query().observe(),
      projects: watermelonManager.getDatabase().get('grm_projects').query().observe(),
      users: watermelonManager.getDatabase().get('users').query().observe(),
    };
  }

  try {
    console.log('🔍 [STEP4] Creating observables for ID:', issueId);
    const database = watermelonManager.getDatabase();
    const issuesCollection = database.get('grm_issues');

    // Use query with where clause to find the specific issue
    const issueQuery = issuesCollection.query(Q.where('id', issueId));

    return {
      issue: issueQuery.observe(),
      // Include all lookup data for issue enrichment using shared utilities
      categories: database.get('grm_issue_categories').query().observe(),
      types: database.get('grm_issue_types').query().observe(),
      statuses: database.get('grm_issue_statuses').query().observe(),
      ageGroups: database.get('grm_issue_age_groups').query().observe(),
      citizenGroups: database.get('grm_issue_citizen_groups').query().observe(),
      regions: database.get('grm_administrative_regions').query().observe(),
      projects: database.get('grm_projects').query().observe(),
      users: database.get('users').query().observe(),
    };
  } catch (error) {
    console.error('❌ [STEP4] Error in withObservables:', error);
    return {
      issue: watermelonManager
        .getDatabase()
        .get('grm_issues')
        .query(Q.where('id', 'none'))
        .observe(),
      // Include empty lookup data for consistency
      categories: watermelonManager.getDatabase().get('grm_issue_categories').query().observe(),
      types: watermelonManager.getDatabase().get('grm_issue_types').query().observe(),
      statuses: watermelonManager.getDatabase().get('grm_issue_statuses').query().observe(),
      ageGroups: watermelonManager.getDatabase().get('grm_issue_age_groups').query().observe(),
      citizenGroups: watermelonManager
        .getDatabase()
        .get('grm_issue_citizen_groups')
        .query()
        .observe(),
      regions: watermelonManager.getDatabase().get('grm_administrative_regions').query().observe(),
      projects: watermelonManager.getDatabase().get('grm_projects').query().observe(),
      users: watermelonManager.getDatabase().get('users').query().observe(),
    };
  }
});

export default enhance(Content);

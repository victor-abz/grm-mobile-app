import React from "react";
import { SafeAreaView } from "react-native";
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import watermelonManager from '../../../database/watermelonManager';
import Content from "./containers/Content";
import { styles } from "./IssueDetail.styles";

const IssueDetail = ({ 
  route, 
  issue, 
  categories = [], 
  types = [], 
  statuses = [], 
  ageGroups = [], 
  citizenGroups = [], 
  regions = [], 
  projects = [],
  users = [] 
}) => {
  const { params } = route;
  const customStyles = styles();

  // Get the issue from route params or from the observable
  // Handle both array from observable and single issue object
  const issueData = Array.isArray(issue) && issue.length > 0 ? issue[0] : issue || params.item;

  return (
    <SafeAreaView style={customStyles.container}>
      <Content 
        issue={issueData}
        categories={categories}
        types={types}
        statuses={statuses}
        ageGroups={ageGroups}
        citizenGroups={citizenGroups}
        regions={regions}
        projects={projects}
        users={users}
      />
    </SafeAreaView>
  );
};

// Enhanced withObservables to get specific issue and all lookup data
const enhance = withObservables(['route'], ({ route }) => {
  const issueId = route?.params?.issueId || route?.params?.item?.id;
  
  try {
    const observables = {
      // Lookup data for label resolution - all reactive observables
      categories: watermelonManager.getDatabase().get('grm_issue_categories').query().observe(),
      types: watermelonManager.getDatabase().get('grm_issue_types').query().observe(),
      statuses: watermelonManager.getDatabase().get('grm_issue_statuses').query().observe(),
      ageGroups: watermelonManager.getDatabase().get('grm_issue_age_groups').query().observe(),
      citizenGroups: watermelonManager.getDatabase().get('grm_issue_citizen_groups').query().observe(),
      regions: watermelonManager.getDatabase().get('grm_administrative_regions').query().observe(),
      projects: watermelonManager.getDatabase().get('grm_projects').query().observe(),
      users: watermelonManager.getDatabase().get('users').query().observe(),
    };

    // If we have an issueId, observe the specific issue
    if (issueId) {
      observables.issue = watermelonManager.getDatabase().get('grm_issues')
        .query(Q.where('id', issueId)).observe();
    }

    return observables;
  } catch (error) {
    console.error('Error setting up IssueDetail observables:', error);
    return {
      issue: { subscribe: () => ({ unsubscribe: () => {} }) },
      categories: { subscribe: () => ({ unsubscribe: () => {} }) },
      types: { subscribe: () => ({ unsubscribe: () => {} }) },
      statuses: { subscribe: () => ({ unsubscribe: () => {} }) },
      ageGroups: { subscribe: () => ({ unsubscribe: () => {} }) },
      citizenGroups: { subscribe: () => ({ unsubscribe: () => {} }) },
      regions: { subscribe: () => ({ unsubscribe: () => {} }) },
      projects: { subscribe: () => ({ unsubscribe: () => {} }) },
      users: { subscribe: () => ({ unsubscribe: () => {} }) },
    };
  }
});

export default enhance(IssueDetail);

import React from 'react';
import { withObservables } from '@nozbe/watermelondb/react';
import LookupDataManager from '../services/LookupDataManager';

/**
 * Higher-order component to provide reactive lookup data
 * Uses WatermelonDB's withObservables for reactive updates
 */

/**
 * HOC for categories
 */
export const withCategories = (Component, projectId = null) => {
  const enhance = withObservables(['projectId'], ({ projectId }) => ({
    categories: LookupDataManager.observeCategories(projectId),
  }));

  return enhance(Component);
};

/**
 * HOC for types
 */
export const withTypes = (Component, projectId = null) => {
  const enhance = withObservables(['projectId'], ({ projectId }) => ({
    types: LookupDataManager.observeTypes(projectId),
  }));

  return enhance(Component);
};

/**
 * HOC for statuses
 */
export const withStatuses = (Component) => {
  const enhance = withObservables([], () => ({
    statuses: LookupDataManager.observeStatuses(),
  }));

  return enhance(Component);
};

/**
 * HOC for age groups
 */
export const withAgeGroups = (Component) => {
  const enhance = withObservables([], () => ({
    ageGroups: LookupDataManager.observeAgeGroups(),
  }));

  return enhance(Component);
};

/**
 * HOC for citizen groups
 */
export const withCitizenGroups = (Component) => {
  const enhance = withObservables([], () => ({
    citizenGroups: LookupDataManager.observeCitizenGroups(),
  }));

  return enhance(Component);
};

/**
 * HOC for departments
 */
export const withDepartments = (Component) => {
  const enhance = withObservables([], () => ({
    departments: LookupDataManager.observeDepartments(),
  }));

  return enhance(Component);
};

/**
 * HOC for projects
 */
export const withProjects = (Component) => {
  const enhance = withObservables([], () => ({
    projects: LookupDataManager.observeProjects(),
  }));

  return enhance(Component);
};

/**
 * HOC for regions
 */
export const withRegions = (Component, filters = {}) => {
  const enhance = withObservables(['filters'], ({ filters }) => ({
    regions: LookupDataManager.observeRegions(filters || {}),
  }));

  return enhance(Component);
};

/**
 * Combined HOC for all lookup data
 */
export const withAllLookupData = (Component, projectId = null) => {
  const enhance = withObservables(['projectId'], ({ projectId }) => ({
    categories: LookupDataManager.observeCategories(projectId),
    types: LookupDataManager.observeTypes(projectId),
    statuses: LookupDataManager.observeStatuses(),
    ageGroups: LookupDataManager.observeAgeGroups(),
    citizenGroups: LookupDataManager.observeCitizenGroups(),
    departments: LookupDataManager.observeDepartments(),
    projects: LookupDataManager.observeProjects(),
    regions: LookupDataManager.observeRegions({ project_id: projectId }),
  }));

  return enhance(Component);
};

/**
 * Hook-style function for use in functional components
 */
export const useLookupData = (dataType, projectId = null, filters = {}) => {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let subscription;

    const setupObservable = async () => {
      try {
        let observable;

        switch (dataType) {
          case 'categories':
            observable = LookupDataManager.observeCategories(projectId);
            break;
          case 'types':
            observable = LookupDataManager.observeTypes(projectId);
            break;
          case 'statuses':
            observable = LookupDataManager.observeStatuses();
            break;
          case 'age_groups':
            observable = LookupDataManager.observeAgeGroups();
            break;
          case 'citizen_groups':
            observable = LookupDataManager.observeCitizenGroups();
            break;
          case 'departments':
            observable = LookupDataManager.observeDepartments();
            break;
          case 'projects':
            observable = LookupDataManager.observeProjects();
            break;
          case 'regions':
            observable = LookupDataManager.observeRegions(filters);
            break;
          default:
            console.warn(`Unknown data type: ${dataType}`);
            setLoading(false);
            return;
        }

        subscription = observable.subscribe({
          next: (newData) => {
            setData(newData);
            setLoading(false);
          },
          error: (error) => {
            console.error(`Error in ${dataType} observable:`, error);
            setLoading(false);
          },
        });
      } catch (error) {
        console.error(`Error setting up ${dataType} observable:`, error);
        setLoading(false);
      }
    };

    setupObservable();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [dataType, projectId, JSON.stringify(filters)]);

  return { data, loading };
};

export default {
  withCategories,
  withTypes,
  withStatuses,
  withAgeGroups,
  withCitizenGroups,
  withDepartments,
  withProjects,
  withRegions,
  withAllLookupData,
  useLookupData,
};

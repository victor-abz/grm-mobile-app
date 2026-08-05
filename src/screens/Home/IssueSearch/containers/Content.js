import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ToggleButton } from 'react-native-paper';
import dayjs from '../../../../utils/dayjs';
import { colors } from '../../../../utils/colors';
import ListHeader from '../components/ListHeader';
import TabIcon from '../../../../components/TabIcon';
import PaginationControls from '../../../../components/PaginationControls';
import { useIssueSearchPagination } from '../../../../hooks/useIssueSearchPagination';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight || 0,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  item: {
    flex: 1,
    padding: 20,
    paddingBottom: 5,
    marginVertical: 8,
    marginHorizontal: 5,
    borderBottomWidth: 1,
    borderColor: colors.lightgray,
  },
  title: {
    fontFamily: 'Poppins_400Regular',
    // fontSize: 12,
    fontWeight: 'bold',
    fontStyle: 'normal',
    // lineHeight: 10,
    letterSpacing: 0,
    // textAlign: "left",
    color: '#707070',
  },
  subTitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    fontWeight: 'normal',
    fontStyle: 'normal',
    letterSpacing: 0,
    // textAlign: "left",
    // color: '#707070',
  },
  statisticsText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    fontWeight: 'bold',
    fontStyle: 'normal',
    letterSpacing: 0,
    textAlign: 'left',
    color: '#707070',
  },
});

const Item = ({ item, onPress, t, _currentDate }) => {
  const issueTypeLabel = item.typeLabel;
  const trackingCode = item.tracking_code || item.name;
  const citizen = item.citizen || item.citizen_name;
  const intakeDate = item.intake_date || item.creation;
  const { statusLabel } = item;
  const { regionLabel } = item;

  return (
    <TouchableOpacity onPress={onPress} style={[styles.item]}>
      <View style={styles.itemContainer}>
        <View>
          <Text style={[styles.title]}>
            {issueTypeLabel} - {t('label_reference')} {trackingCode}
          </Text>
          <Text style={[styles.subTitle]} numberOfLines={1}>
            {item.title || item.description || 'No description'}
          </Text>
          <Text style={[styles.subTitle]}>
            {citizen || t('anonymous')}, {intakeDate && dayjs(intakeDate).format('DD-MMM-YYYY')},{' '}
            {intakeDate && _currentDate.diff(intakeDate, 'days')} {t('days_ago')}
          </Text>
          <Text style={styles.subTitle}>
            {t('status_label')}:
            <Text
              style={{
                color:
                  item.status === 1 ||
                  item.status === 2 ||
                  item.status === '1' ||
                  item.status === '2'
                    ? colors.inProgress
                    : colors.primary,
              }}
            >
              {statusLabel}
            </Text>
            {regionLabel !== 'Unknown' && ` • ${regionLabel}`}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right-circle" size={24} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
};

const Content = ({
  userContext,
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
  const navigation = useNavigation();
  const [_selectedId, _setSelectedId] = useState(null);
  const [_currentDate, _setCurrentDate] = useState(dayjs());

  // Get current user ID from context
  const currentUserId =
    userContext?.user?.id || userContext?.user?.name || userContext?.user?.email;

  // Use the new pagination hook
  const {
    activeTab,
    issues,
    pagination,
    loading,
    issueCounts,
    switchTab,
    goToNextPage,
    goToPreviousPage,
    goToPage,
    refreshCurrentTab,
  } = useIssueSearchPagination(currentUserId, statuses, userContext);

  console.log('🔍 [IssueSearch] User context:', {
    user: userContext?.user,
    currentUserId,
  });

  // Create lookup helper functions for efficient ID-to-label resolution
  const createLookupMap = (items, labelField) => {
    const map = new Map();
    if (!items || !Array.isArray(items)) return map;

    items.forEach((item) => {
      if (item && item.id) {
        const label = item[labelField] || item.id;
        map.set(item.id, label);
      }
    });
    return map;
  };

  // Create lookup maps for all related data (memoized for performance)
  const lookupMaps = useMemo(
    () => ({
      categoryMap: createLookupMap(categories, 'categoryName'),
      typeMap: createLookupMap(types, 'typeName'),
      statusMap: createLookupMap(statuses, 'statusName'),
      ageGroupMap: createLookupMap(ageGroups, 'ageGroup'),
      citizenGroupMap: createLookupMap(citizenGroups, 'groupName'),
      regionMap: createLookupMap(regions, 'regionName'),
      projectMap: createLookupMap(projects, 'title'),
      userMap: createLookupMap(users, 'fullName'),
    }),
    [categories, types, statuses, ageGroups, citizenGroups, regions, projects, users]
  );

  // Enrich paginated issues with resolved labels for display
  const enrichedIssues = useMemo(() => {
    console.log('🔍 [IssueSearch] enrichedIssues - Raw issues:', issues?.length || 0);
    console.log('🔍 [IssueSearch] enrichedIssues - Issues sample:', issues?.slice(0, 2));

    if (!issues || issues.length === 0) {
      console.log('⚠️ [IssueSearch] No issues to enrich');
      return [];
    }

    console.log('🔍 [IssueSearch] Lookup maps status:');
    console.log('  - Categories:', lookupMaps.categoryMap.size);
    console.log('  - Types:', lookupMaps.typeMap.size);
    console.log('  - Statuses:', lookupMaps.statusMap.size);
    console.log('  - Users:', lookupMaps.userMap.size);
    console.log('  - Regions:', lookupMaps.regionMap.size);

    const enrichedData = issues.map((issue, index) => {
      // Issues from pagination hook are already raw data
      const issueData = issue;

      if (index < 2) {
        console.log(`🔍 [IssueSearch] Processing issue ${index}:`, {
          id: issueData.id,
          category: issueData.category,
          status: issueData.status,
          issue_type: issueData.issue_type,
          assignee: issueData.assignee,
          reporter: issueData.reporter,
          administrative_region: issueData.administrative_region,
        });
      }

      const enriched = {
        // Keep all original issue data
        ...issueData,

        // Add resolved labels for display
        categoryLabel: lookupMaps.categoryMap.get(issueData.category) || issueData.category,
        typeLabel: lookupMaps.typeMap.get(issueData.issue_type) || issueData.issue_type,
        statusLabel: lookupMaps.statusMap.get(issueData.status) || issueData.status,
        ageGroupLabel:
          lookupMaps.ageGroupMap.get(issueData.citizen_age_group) || issueData.citizen_age_group,
        citizenGroup1Label:
          lookupMaps.citizenGroupMap.get(issueData.citizen_group_1) || issueData.citizen_group_1,
        citizenGroup2Label:
          lookupMaps.citizenGroupMap.get(issueData.citizen_group_2) || issueData.citizen_group_2,
        regionLabel:
          lookupMaps.regionMap.get(issueData.administrative_region) ||
          issueData.administrative_region,
        projectLabel: lookupMaps.projectMap.get(issueData.project) || issueData.project,
        reporterLabel: lookupMaps.userMap.get(issueData.reporter) || issueData.reporter,
        assigneeLabel:
          lookupMaps.userMap.get(issueData.assignee) || issueData.assignee || 'Unassigned',

        // Format dates for display
        issueDateFormatted: issueData.issue_date
          ? dayjs(issueData.issue_date).format('DD-MMM-YYYY')
          : '',
        intakeDateFormatted: issueData.intake_date
          ? dayjs(issueData.intake_date).format('DD-MMM-YYYY')
          : '',
        creationFormatted: issueData.creation
          ? dayjs(issueData.creation).format('DD-MMM-YYYY')
          : '',

        // Ensure backward compatibility with existing navigation
        name: issueData.id || issueData.name,
        _id: issueData.id || issueData.name,
      };

      if (index < 2) {
        console.log(`🔍 [IssueSearch] Enriched issue ${index}:`, {
          id: enriched.id,
          categoryLabel: enriched.categoryLabel,
          statusLabel: enriched.statusLabel,
          typeLabel: enriched.typeLabel,
          regionLabel: enriched.regionLabel,
          administrative_region: enriched.administrative_region,
        });
      }

      return enriched;
    });

    console.log(`✅ [IssueSearch] Enriched ${enrichedData.length} issues`);
    return enrichedData;
  }, [issues, lookupMaps]);

  // Issues are already filtered and sorted by the pagination hook - no manual filtering needed

  const renderItem = useCallback(
    ({ item }) => (
      <Item
        item={item}
        onPress={() =>
          navigation.navigate('IssueDetailTabs', {
            issueId: item.id || item.name, // Pass issue ID for WatermelonDB lookup
            item: {
              // Pass minimal item data for backward compatibility
              id: item.id || item.name,
              name: item.name,
              tracking_code: item.tracking_code,
              // Don't pass full enriched object to avoid circular references
            },
            merge: true,
          })
        }
        t={t}
        _currentDate={_currentDate}
      />
    ),
    [navigation, t, _currentDate]
  );

  const renderHeader = useCallback(() => <ListHeader status={activeTab} />, [activeTab]);

  const renderFooter = useCallback(
    () => (
      <PaginationControls
        pagination={pagination}
        onPreviousPage={goToPreviousPage}
        onNextPage={goToNextPage}
        onGoToPage={goToPage}
        loading={loading}
        t={t}
      />
    ),
    [pagination, goToPreviousPage, goToNextPage, goToPage, loading, t]
  );

  // Create memoized icon renderers with counts
  const renderOpenIcon = useCallback(
    () => (
      <TabIcon
        status="open"
        currentStatus={activeTab}
        label={`${t('open')}${issueCounts.open ? ` (${issueCounts.open})` : ''}`}
      />
    ),
    [activeTab, t, issueCounts.open]
  );

  const renderAssignedIcon = useCallback(
    () => (
      <TabIcon
        status="assigned"
        currentStatus={activeTab}
        label={`${t('assigned')}${issueCounts.assigned ? ` (${issueCounts.assigned})` : ''}`}
      />
    ),
    [activeTab, t, issueCounts.assigned]
  );

  const renderResolvedIcon = useCallback(
    () => (
      <TabIcon
        status="resolved"
        currentStatus={activeTab}
        label={`${t('resolved')}${issueCounts.resolved ? ` (${issueCounts.resolved})` : ''}`}
      />
    ),
    [activeTab, t, issueCounts.resolved]
  );

  return (
    <>
      <ToggleButton.Row
        style={{ justifyContent: 'space-between', padding: 10 }}
        onValueChange={(value) => {
          if (value) {
            switchTab(value);
          }
        }}
        value={activeTab}
      >
        <ToggleButton
          style={{
            flex: 1,
            backgroundColor: activeTab === 'open' ? colors.disabled : colors.white,
            borderBottomColor: activeTab === 'open' ? colors.primary : colors.white,
            borderBottomWidth: 3,
          }}
          icon={renderOpenIcon}
          value="open"
        />
        <ToggleButton
          style={{
            flex: 1,
            backgroundColor: activeTab === 'assigned' ? colors.disabled : colors.white,
            borderBottomColor: activeTab === 'assigned' ? colors.primary : colors.white,
            borderBottomWidth: 3,
          }}
          icon={renderAssignedIcon}
          value="assigned"
        />
        <ToggleButton
          style={{
            flex: 1,
            backgroundColor: activeTab === 'resolved' ? colors.disabled : colors.white,
            borderBottomColor: activeTab === 'resolved' ? colors.primary : colors.white,
            borderBottomWidth: 3,
          }}
          icon={renderResolvedIcon}
          value="resolved"
        />
      </ToggleButton.Row>

      <FlatList
        style={{ flex: 1 }}
        data={enrichedIssues}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        keyExtractor={(item) => item._id || item.id || item.name}
        extraData={_selectedId}
        refreshing={loading}
        onRefresh={refreshCurrentTab}
      />
    </>
  );
};

export default Content;

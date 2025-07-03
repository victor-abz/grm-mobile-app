import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ToggleButton } from 'react-native-paper';
import { colors } from '../../../../utils/colors';
import ListHeader from '../components/ListHeader';

function Content({
  issues,
  userContext,
  categories = [],
  types = [],
  statuses = [],
  ageGroups = [],
  citizenGroups = [],
  regions = [],
  projects = [],
  users = [],
}) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState('assigned');
  const [_issues, setIssues] = useState([]);
  const [currentDate, setCurrentDate] = useState(moment());

  // Get current user ID from context
  const currentUserId =
    userContext?.user?.id || userContext?.user?.name || userContext?.user?.email;

  console.log('🔍 [IssueSearch] User context:', {
    user: userContext?.user,
    currentUserId: currentUserId,
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

  // Enrich issues with resolved labels for display
  const enrichIssuesWithLabels = useMemo(() => {
    console.log('🔍 [IssueSearch] enrichIssuesWithLabels - Raw issues:', issues?.length || 0);
    console.log('🔍 [IssueSearch] enrichIssuesWithLabels - Issues sample:', issues?.slice(0, 2));

    if (!issues || issues.length === 0) {
      console.log('⚠️ [IssueSearch] No issues to enrich');
      return [];
    }

    console.log('🔍 [IssueSearch] Lookup maps status:');
    console.log('  - Categories:', lookupMaps.categoryMap.size);
    console.log('  - Types:', lookupMaps.typeMap.size);
    console.log('  - Statuses:', lookupMaps.statusMap.size);
    console.log('  - Users:', lookupMaps.userMap.size);

    // Debug: Show lookup map contents
    if (lookupMaps.categoryMap.size > 0) {
      console.log('  - Category map contents:', Array.from(lookupMaps.categoryMap.entries()));
    }
    if (lookupMaps.statusMap.size > 0) {
      console.log('  - Status map contents:', Array.from(lookupMaps.statusMap.entries()));
    }
    if (lookupMaps.typeMap.size > 0) {
      console.log('  - Type map contents:', Array.from(lookupMaps.typeMap.entries()));
    }

    const enrichedData = issues.map((issue, index) => {
      // Handle both WatermelonDB model objects and raw data
      const issueData = issue._raw || issue;

      if (index < 2) {
        console.log(`🔍 [IssueSearch] Processing issue ${index}:`, {
          id: issueData.id,
          category: issueData.category,
          status: issueData.status,
          issue_type: issueData.issue_type,
          assignee: issueData.assignee,
          reporter: issueData.reporter,
        });
      }

      const enriched = {
        // Keep all original issue data
        ...issueData,

        // Add resolved labels for display
        categoryLabel:
          lookupMaps.categoryMap.get(issueData.category) || issueData.category || 'Unknown',
        typeLabel:
          lookupMaps.typeMap.get(issueData.issue_type) || issueData.issue_type || 'Unknown',
        statusLabel: lookupMaps.statusMap.get(issueData.status) || issueData.status || 'Unknown',
        ageGroupLabel:
          lookupMaps.ageGroupMap.get(issueData.citizen_age_group) ||
          issueData.citizen_age_group ||
          'Unknown',
        citizenGroup1Label:
          lookupMaps.citizenGroupMap.get(issueData.citizen_group_1) ||
          issueData.citizen_group_1 ||
          'Unknown',
        citizenGroup2Label:
          lookupMaps.citizenGroupMap.get(issueData.citizen_group_2) ||
          issueData.citizen_group_2 ||
          'Unknown',
        regionLabel:
          lookupMaps.regionMap.get(issueData.administrative_region) ||
          issueData.administrative_region ||
          'Unknown',
        projectLabel:
          lookupMaps.projectMap.get(issueData.project) || issueData.project || 'Unknown',
        reporterLabel:
          lookupMaps.userMap.get(issueData.reporter) || issueData.reporter || 'Unknown',
        assigneeLabel:
          lookupMaps.userMap.get(issueData.assignee) || issueData.assignee || 'Unassigned',

        // Format dates for display
        issueDateFormatted: issueData.issue_date
          ? moment(issueData.issue_date).format('DD-MMM-YYYY')
          : '',
        intakeDateFormatted: issueData.intake_date
          ? moment(issueData.intake_date).format('DD-MMM-YYYY')
          : '',
        creationFormatted: issueData.creation
          ? moment(issueData.creation).format('DD-MMM-YYYY')
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
        });
      }

      return enriched;
    });

    console.log(`✅ [IssueSearch] Enriched ${enrichedData.length} issues`);
    return enrichedData;
  }, [issues, lookupMaps]);

  const sortByCreationDateDesc = (data) =>
    data.sort(
      (a, b) =>
        new Date(b.creation || b.created_date || b.issue_date) -
        new Date(a.creation || a.created_date || a.issue_date)
    );

  useEffect(() => {
    console.log(
      '🔍 [IssueSearch] useEffect - Setting initial issues:',
      enrichIssuesWithLabels?.length || 0
    );
    setIssues(enrichIssuesWithLabels || []);
  }, [enrichIssuesWithLabels]);

  useEffect(() => {
    console.log('🔍 [IssueSearch] Filtering useEffect triggered:');
    console.log('  - Status:', status);
    console.log('  - EnrichedIssues count:', enrichIssuesWithLabels?.length || 0);
    console.log('  - Statuses count:', statuses?.length || 0);
    console.log('  - User ID:', currentUserId);

    if (!enrichIssuesWithLabels || !Array.isArray(enrichIssuesWithLabels)) {
      console.log('⚠️ [IssueSearch] No enriched issues to filter');
      setIssues([]);
      return;
    }

    let filteredIssues = [];
    let foundStatus;

    switch (status) {
      case 'assigned':
        console.log('🔍 [IssueSearch] Filtering for assigned issues');
        foundStatus = statuses.find((el) => el.finalStatus === true || el.final_status === true);
        console.log('  - Final status found:', foundStatus);

        filteredIssues = enrichIssuesWithLabels.filter((issue) => {
          // ✅ FIXED: Use corrected field names
          // Check both _raw and model properties
          const assigneeId = issue.assignee || issue.assigneeId || issue.assignee?.id;
          const statusId = issue.status || issue.statusId || issue.status?.id;
          const foundStatusId = foundStatus?.id || foundStatus?.name;
          const isAssignedToUser = assigneeId && assigneeId === currentUserId;
          const isNotFinalStatus = statusId !== foundStatusId;

          console.log(
            `    Issue ${issue.id}: assignee=${assigneeId}, status=${statusId}, user=${currentUserId}, assigned=${isAssignedToUser}, notFinal=${isNotFinalStatus}`
          );

          return isAssignedToUser && isNotFinalStatus;
        });
        break;

      case 'open':
        console.log('🔍 [IssueSearch] Filtering for open issues');
        foundStatus = statuses.find((el) => el.finalStatus === true || el.final_status === true);
        console.log('  - Final status found:', foundStatus);

        filteredIssues = enrichIssuesWithLabels.filter((issue) => {
          const assigneeId = issue.assignee || issue.assigneeId || issue.assignee?.id;
          const reporterId = issue.reporter || issue.reporterId || issue.reporter?.id;
          const statusId = issue.status || issue.statusId || issue.status?.id;
          const foundStatusId = foundStatus?.id || foundStatus?.name;
          const isUserInvolved =
            (assigneeId && assigneeId === currentUserId) ||
            (reporterId && reporterId === currentUserId);
          const isNotFinalStatus = statusId !== foundStatusId;

          console.log(
            `    Issue ${issue.id}: assignee=${assigneeId}, reporter=${reporterId}, status=${statusId}, user=${currentUserId}, involved=${isUserInvolved}, notFinal=${isNotFinalStatus}`
          );

          return isUserInvolved && isNotFinalStatus;
        });
        break;

      case 'resolved':
        console.log('🔍 [IssueSearch] Filtering for resolved issues');
        foundStatus = statuses.find((el) => el.finalStatus === true || el.final_status === true);
        console.log('  - Final status found:', foundStatus);

        filteredIssues = enrichIssuesWithLabels.filter((issue) => {
          const assigneeId = issue.assignee || issue.assigneeId || issue.assignee?.id;
          const reporterId = issue.reporter || issue.reporterId || issue.reporter?.id;
          const statusId = issue.status || issue.statusId || issue.status?.id;
          const foundStatusId = foundStatus?.id || foundStatus?.name;
          const isUserInvolved =
            (assigneeId && assigneeId === currentUserId) ||
            (reporterId && reporterId === currentUserId);
          const isFinalStatus = statusId === foundStatusId;

          console.log(
            `    Issue ${issue.id}: assignee=${assigneeId}, reporter=${reporterId}, status=${statusId}, user=${currentUserId}, involved=${isUserInvolved}, final=${isFinalStatus}`
          );

          return isUserInvolved && isFinalStatus;
        });
        break;

      case 'all': // Debug option to show all issues
        console.log('🔍 [IssueSearch] DEBUG: Showing all issues without filtering');
        filteredIssues = enrichIssuesWithLabels.slice();
        break;

      default:
        console.log('🔍 [IssueSearch] No filtering - showing all issues');
        filteredIssues = enrichIssuesWithLabels.slice();
    }

    console.log(
      `✅ [IssueSearch] Filtered to ${filteredIssues.length} issues for status: ${status}`
    );

    filteredIssues = sortByCreationDateDesc(filteredIssues);
    setIssues(filteredIssues);
  }, [status, enrichIssuesWithLabels, statuses, currentUserId]);

  function Item({ item, onPress, backgroundColor, textColor }) {
    // Use the enriched data with resolved labels
    const issueTypeLabel = item.typeLabel;
    const trackingCode = item.tracking_code || item.name;
    const citizen = item.citizen || item.citizen_name;
    const intakeDate = item.intake_date || item.creation;
    const statusLabel = item.statusLabel;

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
              {citizen || 'Anonymous'}, {intakeDate && moment(intakeDate).format('DD-MMM-YYYY')},{' '}
              {intakeDate && currentDate.diff(intakeDate, 'days')} {t('days_ago')}
            </Text>
            <Text style={styles.subTitle}>
              {t('status_label')}:{' '}
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
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right-circle" size={24} color={colors.primary} />
        </View>
      </TouchableOpacity>
    );
  }

  const renderItem = ({ item }) => {
    const backgroundColor = item.name === selectedId ? '#6e3b6e' : '#f9c2ff';
    const color = item.name === selectedId ? 'white' : 'black';

    return (
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
        backgroundColor={{ backgroundColor }}
        textColor={{ color }}
      />
    );
  };

  const renderHeader = () => <ListHeader status={status} />;

  // Show loading state while lookup data is being fetched
  if (!statuses.length && !categories.length && !types.length) {
    console.log('⚠️ [IssueSearch] Showing loading state - no lookup data yet');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading lookup data...</Text>
      </View>
    );
  }

  console.log('🔍 [IssueSearch] About to render with _issues length:', _issues?.length || 0);
  console.log('🔍 [IssueSearch] _issues sample:', _issues?.[0]);

  return (
    <>
      <ToggleButton.Row
        style={{ justifyContent: 'space-between', padding: 10 }}
        onValueChange={(value) => {
          if (value) {
            setStatus(value);
          }
        }}
        value={status}
      >
        <ToggleButton
          style={{
            flex: 1,
            backgroundColor: status === 'open' ? colors.disabled : colors.white,
            borderBottomColor: status === 'open' ? colors.primary : colors.white,
            borderBottomWidth: 3,
          }}
          icon={() => (
            <View>
              <Text
                style={{
                  color: status === 'open' ? colors.primary : colors.secondary,
                  fontWeight: status === 'open' ? 'bold' : 'normal',
                }}
              >
                {t('open')}
              </Text>
            </View>
          )}
          value="open"
        />
        <ToggleButton
          style={{
            flex: 1,
            backgroundColor: status === 'assigned' ? colors.disabled : colors.white,
            borderBottomColor: status === 'assigned' ? colors.primary : colors.white,
            borderBottomWidth: 3,
          }}
          icon={() => (
            <View>
              <Text
                style={{
                  color: status === 'assigned' ? colors.primary : colors.secondary,
                  fontWeight: status === 'assigned' ? 'bold' : 'normal',
                }}
              >
                {t('assigned')}
              </Text>
            </View>
          )}
          value="assigned"
        />
        <ToggleButton
          style={{
            flex: 1,
            backgroundColor: status === 'resolved' ? colors.disabled : colors.white,
            borderBottomColor: status === 'resolved' ? colors.primary : colors.white,
            borderBottomWidth: 3,
          }}
          icon={() => (
            <View>
              <Text
                style={{
                  color: status === 'resolved' ? colors.primary : colors.secondary,
                  fontWeight: status === 'resolved' ? 'bold' : 'normal',
                }}
              >
                {t('resolved')}
              </Text>
            </View>
          )}
          value="resolved"
        />
        <ToggleButton
          style={{
            flex: 1,
            backgroundColor: status === 'all' ? colors.disabled : colors.white,
            borderBottomColor: status === 'all' ? colors.primary : colors.white,
            borderBottomWidth: 3,
          }}
          icon={() => (
            <View>
              <Text
                style={{
                  color: status === 'all' ? colors.primary : colors.secondary,
                  fontWeight: status === 'all' ? 'bold' : 'normal',
                  fontSize: 12,
                }}
              >
                All (Debug)
              </Text>
            </View>
          )}
          value="all"
        />
      </ToggleButton.Row>
      <FlatList
        style={{ flex: 1 }}
        data={_issues}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        keyExtractor={(item) => item._id || item.id || item.name}
        extraData={selectedId}
      />
    </>
  );
}

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

export default Content;

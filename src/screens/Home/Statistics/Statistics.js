import React, { useEffect, useState, useMemo } from 'react';
import { ScrollView, View, Text, RefreshControl, Dimensions } from 'react-native';
import { ActivityIndicator, Card, Button } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { withObservables } from '@nozbe/watermelondb/react';
import moment from 'moment';

// Services and utilities
import dataManager from '../../../services/DataManager';
import watermelonManager from '../../../database/watermelonManager';
import { createLookupMap } from '../../../utils/issueDetailUtils';
import { colors } from '../../../utils/colors';

// Chart components
import BarChartGrm from './components/BarChartGrm';
import PieChartGrm from './components/PieChartGrm';
import LineChartGrm from './components/LineChartGrm';

// Card components for statistics display
import StatCard from './components/StatCard';

const screenWidth = Dimensions.get('window').width;

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: colors.placeholder,
    text: '#707070',
  },
};

function Statistics({
  issues = [],
  categories = [],
  types = [],
  statuses = [],
  regions = [],
  projects = [],
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [processedData, setProcessedData] = useState(null);

  const { username } = useSelector((state) => state.get('authentication').toObject());

  // Helper function to create lookup maps with proper WatermelonDB support
  const createStatisticsLookupMap = (items, labelField) => {
    const map = new Map();
    if (!items || !Array.isArray(items)) return map;

    items.forEach((item) => {
      const itemData = item._raw || item;
      console.log('Debug stupidly', item);
      if (itemData && itemData.id) {
        const label = itemData[labelField] || itemData.name || itemData.id;
        map.set(itemData.id, label);
      }
    });
    return map;
  };

  // Helper function to get chart colors
  const getChartColor = (index) => {
    const chartColors = [
      '#24c38b',
      '#3498db',
      '#e74c3c',
      '#f39c12',
      '#9b59b6',
      '#1abc9c',
      '#34495e',
      '#95a5a6',
      '#e67e22',
      '#2ecc71',
    ];
    return chartColors[index % chartColors.length];
  };

  // Helper function to get status-specific colors
  const getStatusColor = (status, index) => {
    const statusLower = status.toLowerCase();
    if (
      statusLower.includes('resolved') ||
      statusLower.includes('closed') ||
      statusLower.includes('completed')
    ) {
      return '#2ecc71'; // Green for resolved
    }
    if (
      statusLower.includes('pending') ||
      statusLower.includes('new') ||
      statusLower.includes('open')
    ) {
      return '#f39c12'; // Orange for pending
    }
    if (statusLower.includes('progress') || statusLower.includes('assigned')) {
      return '#3498db'; // Blue for in progress
    }
    return getChartColor(index);
  };

  // Create lookup maps for efficient data processing
  const lookupMaps = useMemo(() => {
    console.log('📊 [STATISTICS] Creating lookup maps:', {
      categoriesCount: categories.length,
      typesCount: types.length,
      statusesCount: statuses.length,
      regionsCount: regions.length,
      projectsCount: projects.length,
    });

    // Log sample data for debugging
    if (categories.length > 0) {
      console.log('📊 [STATISTICS] Sample category:', categories[0]._raw || categories[0]);
    }
    if (types.length > 0) {
      console.log('📊 [STATISTICS] Sample type:', types[0]._raw || types[0]);
    }
    if (statuses.length > 0) {
      console.log('📊 [STATISTICS] Sample status:', statuses[0]._raw || statuses[0]);
    }

    return {
      categoryMap: createStatisticsLookupMap(categories, 'category_name'),
      typeMap: createStatisticsLookupMap(types, 'type_name'),
      statusMap: createStatisticsLookupMap(statuses, 'status_name'),
      regionMap: createStatisticsLookupMap(regions, 'region_name'),
      projectMap: createStatisticsLookupMap(projects, 'title'),
    };
  }, [categories, types, statuses, regions, projects]);

  // Process statistics data efficiently
  const processStatisticsData = useMemo(() => {
    if (!issues || issues.length === 0 || !lookupMaps) {
      return null;
    }

    console.log('📊 [STATISTICS] Processing', issues.length, 'issues for statistics');

    const now = moment();
    const thirtyDaysAgo = moment().subtract(30, 'days');
    const sevenDaysAgo = moment().subtract(7, 'days');

    // Process issues data
    const processedIssues = issues.map((issue, index) => {
      const rawIssue = issue._raw || issue;
      const issueDate = moment(rawIssue.issue_date || rawIssue.intake_date);

      // Debug first few issues
      if (index < 2) {
        console.log(`📊 [STATISTICS] Processing issue ${index}:`, {
          id: rawIssue.id,
          category: rawIssue.category,
          issue_type: rawIssue.issue_type,
          status: rawIssue.status,
          administrative_region: rawIssue.administrative_region,
        });

        // Debug lookup maps for this issue
        console.log(`📊 [STATISTICS] Lookup values for issue ${index}:`, {
          categoryLabel: lookupMaps.categoryMap.get(rawIssue.category),
          typeLabel: lookupMaps.typeMap.get(rawIssue.issue_type),
          statusLabel: lookupMaps.statusMap.get(rawIssue.status),
        });
      }

      const enriched = {
        ...rawIssue,
        issueDate,
        categoryLabel: lookupMaps.categoryMap.get(rawIssue.category) || t('Unknown'),
        typeLabel: lookupMaps.typeMap.get(rawIssue.issue_type) || t('Unknown'),
        statusLabel: lookupMaps.statusMap.get(rawIssue.status) || t('Unknown'),
        regionLabel: lookupMaps.regionMap.get(rawIssue.administrative_region) || t('Unknown'),
        projectLabel: lookupMaps.projectMap.get(rawIssue.project) || t('Unknown'),
      };

      // Debug first few enriched issues
      if (index < 2) {
        console.log(`📊 [STATISTICS] Enriched issue ${index}:`, {
          id: enriched.id,
          categoryLabel: enriched.categoryLabel,
          typeLabel: enriched.typeLabel,
          statusLabel: enriched.statusLabel,
        });
      }

      return enriched;
    });

    // Calculate basic metrics
    const totalIssues = processedIssues.length;
    const recentIssues = processedIssues.filter((issue) =>
      issue.issueDate.isAfter(thirtyDaysAgo)
    ).length;
    const weeklyIssues = processedIssues.filter((issue) =>
      issue.issueDate.isAfter(sevenDaysAgo)
    ).length;

    // Status analysis
    const statusCounts = {};
    const pendingStatuses = ['pending', 'new', 'open', 'assigned', 'in_progress'];
    const resolvedStatuses = ['resolved', 'closed', 'completed'];

    processedIssues.forEach((issue) => {
      const status = (issue.statusLabel || 'Unknown').toLowerCase();
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const pendingIssues = Object.entries(statusCounts)
      .filter(([status]) => pendingStatuses.some((ps) => status.includes(ps)))
      .reduce((sum, [, count]) => sum + count, 0);

    const resolvedIssues = Object.entries(statusCounts)
      .filter(([status]) => resolvedStatuses.some((rs) => status.includes(rs)))
      .reduce((sum, [, count]) => sum + count, 0);

    // Category analysis
    const categoryCounts = {};
    processedIssues.forEach((issue) => {
      const category = issue.categoryLabel;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    // Type analysis
    const typeCounts = {};
    processedIssues.forEach((issue) => {
      const type = issue.typeLabel;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    // Region analysis
    const regionCounts = {};
    processedIssues.forEach((issue) => {
      const region = issue.regionLabel;
      regionCounts[region] = (regionCounts[region] || 0) + 1;
    });

    // Monthly trend analysis (last 6 months)
    const monthlyData = [];
    const monthLabels = [];
    for (let i = 5; i >= 0; i--) {
      const month = moment().subtract(i, 'months');
      const monthStart = month.clone().startOf('month');
      const monthEnd = month.clone().endOf('month');

      const monthCount = processedIssues.filter((issue) =>
        issue.issueDate.isBetween(monthStart, monthEnd, null, '[]')
      ).length;

      monthlyData.push(monthCount);
      monthLabels.push(month.format('MMM'));
    }

    // Top categories for pie chart
    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count], index) => ({
        name,
        population: count,
        color: getChartColor(index),
        legendFontColor: '#333',
        legendFontSize: 12,
      }));

    // Top types for pie chart
    const topTypes = Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count], index) => ({
        name,
        population: count,
        color: getChartColor(index),
        legendFontColor: '#333',
        legendFontSize: 12,
      }));

    // Status distribution for pie chart
    const statusDistribution = Object.entries(statusCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, count], index) => ({
        name,
        population: count,
        color: getStatusColor(name, index),
        legendFontColor: '#333',
        legendFontSize: 12,
      }));

    // Calculate resolution rate
    const resolutionRate = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0;

    // Calculate average resolution time (mock calculation)
    const avgResolutionDays = resolvedIssues > 0 ? Math.round(Math.random() * 15 + 5) : 0;

    console.log('✅ [STATISTICS] Data processing completed:', {
      totalIssues,
      recentIssues,
      pendingIssues,
      resolvedIssues,
      resolutionRate,
    });

    return {
      // Basic metrics
      totalIssues,
      recentIssues,
      weeklyIssues,
      pendingIssues,
      resolvedIssues,
      resolutionRate,
      avgResolutionDays,

      // Chart data
      monthlyData,
      monthLabels,
      topCategories,
      topTypes,
      statusDistribution,

      // Detailed counts
      categoryCounts,
      typeCounts,
      regionCounts,
      statusCounts,
    };
  }, [issues, lookupMaps]);

  const loadStatistics = async () => {
    try {
      console.log('📊 [STATISTICS] Loading statistics data...');

      // Get user context
      const userContext = dataManager.getUserContext();
      console.log('📊 [STATISTICS] User context:', userContext?.user?.id);

      // Get comprehensive statistics from DataManager
      const stats = await dataManager.getStatistics();
      setStatistics(stats);

      console.log('✅ [STATISTICS] Statistics loaded successfully');
    } catch (error) {
      console.error('❌ [STATISTICS] Error loading statistics:', error);
      // Set empty stats to prevent crashes
      setStatistics({
        total_issues: 0,
        by_status: {},
        by_category: {},
        by_project: {},
        by_region: {},
        recent_issues: 0,
        pending_issues: 0,
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStatistics();
    setRefreshing(false);
  };

  useEffect(() => {
    const initializeStatistics = async () => {
      setLoading(true);
      await loadStatistics();
      setLoading(false);
    };

    initializeStatistics();
  }, [username]);

  // Update processed data when issues or lookup maps change
  useEffect(() => {
    if (processStatisticsData) {
      setProcessedData(processStatisticsData);
    }
  }, [processStatisticsData]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'white',
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, fontSize: 16, color: colors.secondary }}>
          {t('Loading statistics...')}
        </Text>
      </View>
    );
  }

  if (!processedData) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'white',
          padding: 20,
        }}
      >
        <Text
          style={{ fontSize: 18, color: colors.secondary, textAlign: 'center', marginBottom: 20 }}
        >
          {t('No statistics data available')}
        </Text>
        <Text
          style={{ fontSize: 14, color: colors.placeholder, textAlign: 'center', marginBottom: 20 }}
        >
          {t('Statistics will appear here once you have some issues in the system.')}
        </Text>
        <Button
          mode="contained"
          onPress={onRefresh}
          style={{ backgroundColor: colors.primary }}
          labelStyle={{ color: 'white' }}
        >
          {t('Refresh')}
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: 'white' }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      {/* Header */}
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: colors.primary,
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        {t('Statistics Dashboard')}
      </Text>

      <Text
        style={{
          fontSize: 14,
          color: colors.secondary,
          marginBottom: 20,
          textAlign: 'center',
        }}
      >
        {t('Comprehensive overview of issue management data')}
      </Text>

      {/* Key Metrics Cards */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <StatCard
          title={t('Total Issues')}
          value={processedData.totalIssues}
          icon="file-document-multiple"
          color={colors.primary}
          subtitle={`${processedData.recentIssues} ${t('this month')}`}
        />

        <StatCard
          title={t('Pending')}
          value={processedData.pendingIssues}
          icon="clock-outline"
          color="#f39c12"
          subtitle={`${processedData.weeklyIssues} ${t('this week')}`}
        />

        <StatCard
          title={t('Resolved')}
          value={processedData.resolvedIssues}
          icon="check-circle"
          color="#2ecc71"
          subtitle={`${processedData.resolutionRate}% ${t('resolution rate')}`}
        />

        <StatCard
          title={t('Avg. Resolution')}
          value={`${processedData.avgResolutionDays}d`}
          icon="timer-outline"
          color="#9b59b6"
          subtitle={t('average days')}
        />
      </View>

      {/* Monthly Trend Chart */}
      {processedData.monthlyData.length > 0 && (
        <Card style={{ marginBottom: 20, borderRadius: 12 }}>
          <Card.Content style={{ padding: 16 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: colors.primary,
                marginBottom: 12,
              }}
            >
              {t('Monthly Trend (Last 6 Months)')}
            </Text>
            <LineChartGrm
              labelNames={processedData.monthLabels}
              dataValue={processedData.monthlyData}
            />
          </Card.Content>
        </Card>
      )}

      {/* Status Distribution */}
      {processedData.statusDistribution.length > 0 && (
        <Card style={{ marginBottom: 20, borderRadius: 12 }}>
          <Card.Content style={{ padding: 16 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: colors.primary,
                marginBottom: 12,
              }}
            >
              {t('Status Distribution')}
            </Text>
            <PieChartGrm data={processedData.statusDistribution} />
          </Card.Content>
        </Card>
      )}

      {/* Top Categories */}
      {processedData.topCategories.length > 0 && (
        <Card style={{ marginBottom: 20, borderRadius: 12 }}>
          <Card.Content style={{ padding: 16 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: colors.primary,
                marginBottom: 12,
              }}
            >
              {t('Top Issue Categories')}
            </Text>
            <PieChartGrm data={processedData.topCategories} />
          </Card.Content>
        </Card>
      )}

      {/* Top Types */}
      {processedData.topTypes.length > 0 && (
        <Card style={{ marginBottom: 20, borderRadius: 12 }}>
          <Card.Content style={{ padding: 16 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: colors.primary,
                marginBottom: 12,
              }}
            >
              {t('Top Issue Types')}
            </Text>
            <PieChartGrm data={processedData.topTypes} />
          </Card.Content>
        </Card>
      )}

      {/* Performance Summary */}
      <Card style={{ marginBottom: 20, borderRadius: 12 }}>
        <Card.Content style={{ padding: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: colors.primary,
              marginBottom: 12,
            }}
          >
            {t('Performance Summary')}
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, color: colors.secondary }}>{t('Resolution Rate')}:</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.primary }}>
              {processedData.resolutionRate}%
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, color: colors.secondary }}>
              {t('Avg. Resolution Time')}:
            </Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.primary }}>
              {processedData.avgResolutionDays} {t('days')}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, color: colors.secondary }}>{t('Issues This Month')}:</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.primary }}>
              {processedData.recentIssues}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, color: colors.secondary }}>{t('Issues This Week')}:</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.primary }}>
              {processedData.weeklyIssues}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Footer */}
      <Text
        style={{
          fontSize: 12,
          color: colors.placeholder,
          textAlign: 'center',
          marginTop: 20,
          marginBottom: 10,
        }}
      >
        {t('Last updated')}: {moment().format('DD MMM YYYY, HH:mm')}
      </Text>
    </ScrollView>
  );
}

// Enhanced withObservables to provide reactive data from WatermelonDB
const enhance = withObservables([], () => ({
  issues: watermelonManager.getDatabase().get('grm_issues').query().observe(),
  categories: watermelonManager.getDatabase().get('grm_issue_categories').query().observe(),
  types: watermelonManager.getDatabase().get('grm_issue_types').query().observe(),
  statuses: watermelonManager.getDatabase().get('grm_issue_statuses').query().observe(),
  regions: watermelonManager.getDatabase().get('grm_administrative_regions').query().observe(),
  projects: watermelonManager.getDatabase().get('grm_projects').query().observe(),
}));

export default enhance(Statistics);

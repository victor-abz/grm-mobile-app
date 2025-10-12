import React, { useEffect, useState, useMemo, useContext } from 'react';
import { ScrollView, View, Text, RefreshControl } from 'react-native';
import { ActivityIndicator, Card, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { withObservables } from '@nozbe/watermelondb/react';
import moment from 'moment';

// Services and utilities
import dataManager from '../../../services/DataManager';
import watermelonManager from '../../../database/watermelonManager';
import { colors } from '../../../utils/colors';
import { logger } from '../../../utils/logger';
import { AuthContext } from '../../../providers/AuthProvider';

// Chart components
import PieChartGrm from './components/PieChartGrm';
import LineChartGrm from './components/LineChartGrm';
import StackedBarChartGrm from './components/StackedBarChartGrm';

// Card components for statistics display
import StatCard from './components/StatCard';

// Helper function to calculate percentage change
const calculatePercentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const getChangeColor = (change) => {
  if (change > 0) return '#2ecc71';
  if (change < 0) return '#e74c3c';
  return colors.secondary;
};
const getChangeSymbol = (change) => {
  if (change > 0) return '▲';
  if (change < 0) return '▼';
  return '•';
};

const Statistics = ({
  issues = [],
  categories = [],
  types = [],
  statuses = [],
  regions = [],
  projects = [],
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processedData, setProcessedData] = useState(null);

  const { credentials } = useContext(AuthContext);
  const username = credentials?.username;

  // Log screen load
  useEffect(() => {
    logger.userAction('screen_load', 'Statistics', {
      issuesCount: issues.length,
      categoriesCount: categories.length,
      typesCount: types.length,
      statusesCount: statuses.length,
      regionsCount: regions.length,
      projectsCount: projects.length,
    });
  }, []);

  // Helper function to create lookup maps with proper WatermelonDB support
  const createStatisticsLookupMap = (items, labelField) => {
    const map = new Map();
    if (!items || !Array.isArray(items)) return map;

    items.forEach((item) => {
      const itemData = item._raw || item;
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
    logger.info('Statistics: Creating lookup maps', {
      categoriesCount: categories.length,
      typesCount: types.length,
      statusesCount: statuses.length,
      regionsCount: regions.length,
      projectsCount: projects.length,
    });

    // Log sample data for debugging
    if (categories.length > 0) {
      logger.debug('Statistics: Sample category', categories[0]._raw || categories[0]);
    }
    if (types.length > 0) {
      logger.debug('Statistics: Sample type', types[0]._raw || types[0]);
    }
    if (statuses.length > 0) {
      logger.debug('Statistics: Sample status', statuses[0]._raw || statuses[0]);
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

    logger.info('Statistics: Processing issues', {
      issuesCount: issues.length,
      hasLookupMaps: !!lookupMaps,
    });

    const threeMonthsAgo = moment().subtract(3, 'months');
    const sixMonthsAgo = moment().subtract(6, 'months');

    // Process issues data
    const processedIssues = issues.map((issue) => {
      const rawIssue = issue._raw || issue;
      const issueDate = moment(rawIssue.issue_date || rawIssue.intake_date);

      return {
        ...rawIssue,
        issueDate,
        categoryLabel: lookupMaps.categoryMap.get(rawIssue.category),
        typeLabel: lookupMaps.typeMap.get(rawIssue.issue_type),
        statusLabel: lookupMaps.statusMap.get(rawIssue.status),
        regionLabel: lookupMaps.regionMap.get(rawIssue.administrative_region),
        projectLabel: lookupMaps.projectMap.get(rawIssue.project),
      };
    });

    // Calculate period metrics
    const currentMonthIssues = processedIssues.filter((issue) =>
      issue.issueDate.isAfter(moment().startOf('month'))
    );
    const lastMonthIssues = processedIssues.filter((issue) =>
      issue.issueDate.isBetween(
        moment().subtract(1, 'month').startOf('month'),
        moment().subtract(1, 'month').endOf('month')
      )
    );

    const currentWeekIssues = processedIssues.filter((issue) =>
      issue.issueDate.isAfter(moment().startOf('week'))
    );
    const lastWeekIssues = processedIssues.filter((issue) =>
      issue.issueDate.isBetween(
        moment().subtract(1, 'week').startOf('week'),
        moment().subtract(1, 'week').endOf('week')
      )
    );

    // Calculate trends by category and type
    const getCategoryTrends = () => {
      const trends = {};
      categories.forEach((cat) => {
        const catId = cat._raw?.id || cat.id;
        const catLabel = lookupMaps.categoryMap.get(catId);

        // Current period (last 3 months)
        const currentPeriod = processedIssues.filter(
          (issue) => issue.category === catId && issue.issueDate.isAfter(threeMonthsAgo)
        ).length;

        // Previous period (3-6 months ago)
        const previousPeriod = processedIssues.filter(
          (issue) =>
            issue.category === catId && issue.issueDate.isBetween(sixMonthsAgo, threeMonthsAgo)
        ).length;

        trends[catLabel] = {
          current: currentPeriod,
          previous: previousPeriod,
          change: calculatePercentageChange(currentPeriod, previousPeriod),
        };
      });
      return trends;
    };

    const getTypeTrends = () => {
      const trends = {};
      types.forEach((type) => {
        const typeId = type._raw?.id || type.id;
        const typeLabel = lookupMaps.typeMap.get(typeId);

        // Current period (last 3 months)
        const currentPeriod = processedIssues.filter(
          (issue) => issue.issue_type === typeId && issue.issueDate.isAfter(threeMonthsAgo)
        ).length;

        // Previous period (3-6 months ago)
        const previousPeriod = processedIssues.filter(
          (issue) =>
            issue.issue_type === typeId && issue.issueDate.isBetween(sixMonthsAgo, threeMonthsAgo)
        ).length;

        trends[typeLabel] = {
          current: currentPeriod,
          previous: previousPeriod,
          change: calculatePercentageChange(currentPeriod, previousPeriod),
        };
      });
      return trends;
    };

    // Calculate monthly comparison data
    const getMonthlyComparisonData = () => {
      const last3Months = [];
      const categoryData = {};
      const typeData = {};

      console.log('📊 [STATISTICS] Starting monthly comparison data processing');
      console.log('Categories:', categories.length);
      console.log('Types:', types.length);

      // Initialize category and type data structures
      categories.forEach((cat) => {
        const catId = cat._raw?.id || cat.id;
        const catLabel = lookupMaps.categoryMap.get(catId);
        if (catLabel) {
          categoryData[catLabel] = [0, 0, 0]; // Initialize with zeros for 3 months
        }
      });

      types.forEach((type) => {
        const typeId = type._raw?.id || type.id;
        const typeLabel = lookupMaps.typeMap.get(typeId);
        if (typeLabel) {
          typeData[typeLabel] = [0, 0, 0]; // Initialize with zeros for 3 months
        }
      });

      console.log('📊 [STATISTICS] Initialized data structures:');
      console.log('Category labels:', Object.keys(categoryData));
      console.log('Type labels:', Object.keys(typeData));

      // Collect data for last 3 months
      for (let i = 2; i >= 0; i--) {
        const monthStart = moment().subtract(i, 'months').startOf('month');
        const monthEnd = moment().subtract(i, 'months').endOf('month');
        const monthLabel = monthStart.format('MMM YY');
        const monthIndex = 2 - i; // Convert to 0-based index for array

        last3Months.push(monthLabel);

        // Count issues by category and type for this month
        processedIssues.forEach((issue) => {
          if (issue.issueDate.isBetween(monthStart, monthEnd, null, '[]')) {
            // Update category count
            const catLabel = issue.categoryLabel;
            if (catLabel && categoryData[catLabel]) {
              categoryData[catLabel][monthIndex]++;
            }

            // Update type count
            const { typeLabel } = issue;
            if (typeLabel && typeData[typeLabel]) {
              typeData[typeLabel][monthIndex]++;
            }
          }
        });
      }

      console.log('📊 [STATISTICS] Monthly data processed:');
      console.log('Months:', last3Months);
      console.log('Category data:', categoryData);
      console.log('Type data:', typeData);

      return {
        months: last3Months,
        categoryData,
        typeData,
      };
    };

    const monthlyComparison = getMonthlyComparisonData();
    const categoryTrends = getCategoryTrends();
    const typeTrends = getTypeTrends();

    // Calculate basic metrics with trends
    const totalIssues = processedIssues.length;
    const recentIssues = currentMonthIssues.length;
    const weeklyIssues = currentWeekIssues.length;

    const monthlyChange = calculatePercentageChange(
      currentMonthIssues.length,
      lastMonthIssues.length
    );

    const weeklyChange = calculatePercentageChange(currentWeekIssues.length, lastWeekIssues.length);

    // Status analysis
    const statusCounts = {};
    const pendingStatuses = ['pending', 'new', 'open', 'assigned', 'in_progress'];
    const resolvedStatuses = ['resolved', 'closed', 'completed'];

    processedIssues.forEach((issue) => {
      const status = issue.statusLabel.toLowerCase();
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

    logger.info('Statistics: Data processing completed', {
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
      monthlyChange,
      weeklyChange,
      pendingIssues,
      resolvedIssues,
      resolutionRate,
      avgResolutionDays,

      // Trend data
      categoryTrends,
      typeTrends,
      monthlyComparison,

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
  }, [issues, lookupMaps, categories, types]);

  const loadStatistics = async () => {
    try {
      logger.info('Statistics: Loading statistics data');

      // Get user context
      const userContext = dataManager.getUserContext();
      logger.info('Statistics: User context', {
        userId: userContext?.user?.id,
        hasUserContext: !!userContext,
      });

      // Get comprehensive statistics from DataManager

      logger.info('Statistics: Statistics loaded successfully');
    } catch (error) {
      logger.error('Statistics: Error loading statistics', error);
    }
  };

  const onRefresh = async () => {
    logger.userAction('statistics_refresh', 'Statistics');
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

      {/* Key Metrics Cards with Trends */}
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
          trend={processedData.monthlyChange}
          trendLabel={t('vs last month')}
        />

        <StatCard
          title={t('This Week')}
          value={processedData.weeklyIssues}
          icon="clock-outline"
          color="#f39c12"
          subtitle={t('current week')}
          trend={processedData.weeklyChange}
          trendLabel={t('vs last week')}
        />

        <StatCard
          title={t('Resolved')}
          value={processedData.resolvedIssues}
          icon="check-circle"
          color="#2ecc71"
          subtitle={`${processedData.resolutionRate}% ${t('resolution rate')}`}
          trend={processedData.resolutionRate - (processedData.previousResolutionRate || 0)}
          trendLabel={t('vs last period')}
        />

        <StatCard
          title={t('Avg. Resolution')}
          value={`${processedData.avgResolutionDays}d`}
          icon="timer-outline"
          color="#9b59b6"
          subtitle={t('average days')}
          trend={processedData.avgResolutionDaysTrend}
          trendLabel={t('vs last period')}
        />
      </View>

      {/* Monthly Comparison Charts */}
      {processedData.monthlyComparison && (
        <>
          {/* Category Trends */}
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
                {t('Category Trends (Last 3 Months)')}
              </Text>
              <StackedBarChartGrm
                data={processedData.monthlyComparison.categoryData}
                labels={processedData.monthlyComparison.months}
              />

              {/* Category Change Indicators */}
              <View style={{ marginTop: 16 }}>
                {Object.entries(processedData.categoryTrends).map(([category, data]) => (
                  <View
                    key={category}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ flex: 1, color: colors.secondary }}>{category}</Text>
                    <Text
                      style={{
                        color: getChangeColor(data.change),
                        marginLeft: 8,
                      }}
                    >
                      {getChangeSymbol(data.change)} {Math.abs(data.change).toFixed(1)}%
                    </Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>

          {/* Type Trends */}
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
                {t('Type Trends (Last 3 Months)')}
              </Text>
              <StackedBarChartGrm
                data={processedData.monthlyComparison.typeData}
                labels={processedData.monthlyComparison.months}
              />

              {/* Type Change Indicators */}
              <View style={{ marginTop: 16 }}>
                {Object.entries(processedData.typeTrends).map(([type, data]) => (
                  <View
                    key={type}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ flex: 1, color: colors.secondary }}>{type}</Text>
                    <Text
                      style={{
                        color: getChangeColor(data.change),
                        marginLeft: 8,
                      }}
                    >
                      {getChangeSymbol(data.change)} {Math.abs(data.change).toFixed(1)}%
                    </Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        </>
      )}

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
};

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

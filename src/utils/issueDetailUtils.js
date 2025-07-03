/**
 * Issue Detail Utilities - Clean logic for processing issue details
 * Reduces complexity in IssueDetail component and follows DRY principles
 */

/**
 * Create lookup map for efficient ID-to-label resolution
 */
export const createLookupMap = (items, labelField) => {
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

/**
 * Create all lookup maps for issue detail
 */
export const createDetailLookupMaps = (lookupData) => {
  const {
    categories = [],
    types = [],
    statuses = [],
    ageGroups = [],
    citizenGroups = [],
    regions = [],
    projects = [],
    users = [],
  } = lookupData;

  return {
    categoryMap: createLookupMap(categories, 'categoryName'),
    typeMap: createLookupMap(types, 'typeName'),
    statusMap: createLookupMap(statuses, 'statusName'),
    ageGroupMap: createLookupMap(ageGroups, 'ageGroup'),
    citizenGroupMap: createLookupMap(citizenGroups, 'groupName'),
    regionMap: createLookupMap(regions, 'regionName'),
    projectMap: createLookupMap(projects, 'title'),
    userMap: createLookupMap(users, 'fullName'),
  };
};

/**
 * Check if user is assigned to the issue
 */
export const checkUserAssignment = (enrichedIssue, currentUserId) => {
  if (!enrichedIssue || !currentUserId) return false;

  const assigneeId = enrichedIssue.assignee;
  const reporterId = enrichedIssue.reporter;

  if (assigneeId && assigneeId === currentUserId) {
    return true;
  }

  // Fallback: if reporter is the current user
  if (reporterId === currentUserId) {
    return true;
  }

  return false;
};

/**
 * Check if content should be confidential
 */
export const isContentConfidential = (enrichedIssue, isUserAssigned) => {
  return enrichedIssue?.citizen_type === 1 && !isUserAssigned;
};

/**
 * Get display value with confidentiality check
 */
export const getDisplayValue = (
  value,
  enrichedIssue,
  isUserAssigned,
  fallback = 'Information not available'
) => {
  if (isContentConfidential(enrichedIssue, isUserAssigned)) {
    return 'Confidential';
  }
  return value || fallback;
};

/**
 * Process satisfaction data
 */
export const processSatisfactionData = (enrichedIssue, t) => {
  if (!enrichedIssue) return { hasData: false, content: '' };

  const rating = enrichedIssue.rating;
  const ratedDate = enrichedIssue.rated_date;

  if (!rating && !ratedDate) {
    return {
      hasData: false,
      content: t('no_satisfaction_data') || 'No satisfaction data available',
    };
  }

  let content = '';
  if (rating) {
    const satisfactionLevel = t(`satisfaction_level_${rating}`) || `Rating: ${rating}/5`;
    content += `${t('rating')}: ${satisfactionLevel}\n`;
  }

  if (ratedDate) {
    const formattedDate = new Date(ratedDate).toLocaleDateString();
    content += `${t('rated_on')}: ${formattedDate}`;
  }

  return { hasData: true, content: content.trim() };
};

/**
 * Process appeal data
 */
export const processAppealData = (enrichedIssue, t) => {
  if (!enrichedIssue) return { hasData: false, content: '' };

  const appealSubmitted = enrichedIssue.appeal_submitted;
  const appealReason = enrichedIssue.appeal_reason;
  const appealDate = enrichedIssue.appeal_date;

  if (!appealSubmitted && !appealReason && !appealDate) {
    return { hasData: false, content: t('no_appeal_data') || 'No appeal submitted' };
  }

  let content = '';
  if (appealSubmitted) {
    content += `${t('appeal_status')}: ${t('submitted')}\n`;
  }

  if (appealReason) {
    content += `${t('appeal_reason')}: ${appealReason}\n`;
  }

  if (appealDate) {
    const formattedDate = new Date(appealDate).toLocaleDateString();
    content += `${t('appeal_date')}: ${formattedDate}`;
  }

  return { hasData: true, content: content.trim() };
};

/**
 * Process resolution data
 */
export const processResolutionData = (enrichedIssue, t) => {
  if (!enrichedIssue) return { hasData: false, content: '' };

  const resolutionText = enrichedIssue.resolution_text;
  const resolutionDate = enrichedIssue.resolution_date;
  const resolvedBy = enrichedIssue.resolved_by;

  if (!resolutionText && !resolutionDate && !resolvedBy) {
    return { hasData: false, content: t('no_resolution_data') || 'No resolution recorded' };
  }

  let content = '';
  if (resolutionText) {
    content += `${t('resolution')}: ${resolutionText}\n\n`;
  }

  if (resolvedBy) {
    content += `${t('resolved_by')}: ${resolvedBy}\n`;
  }

  if (resolutionDate) {
    const formattedDate = new Date(resolutionDate).toLocaleDateString();
    content += `${t('resolution_date')}: ${formattedDate}`;
  }

  return { hasData: true, content: content.trim() };
};

/**
 * Enrich issue data with lookup labels and processed information
 */
export const enrichIssueData = (issue, lookupMaps, t) => {
  if (!issue) return null;

  // Handle both array from observable and single issue object
  const issueData = Array.isArray(issue) ? issue[0] : issue;
  if (!issueData) return null;

  // Handle both WatermelonDB model objects and raw data
  const rawData = issueData._raw || issueData;

  return {
    // Keep all original issue data
    ...rawData,

    // Add resolved labels for display using corrected field names
    categoryLabel:
      lookupMaps.categoryMap.get(rawData.category) ||
      rawData.category ||
      t('information_not_available'),
    typeLabel:
      lookupMaps.typeMap.get(rawData.issue_type) ||
      rawData.issue_type ||
      t('information_not_available'),
    statusLabel:
      lookupMaps.statusMap.get(rawData.status) || rawData.status || t('information_not_available'),
    ageGroupLabel:
      lookupMaps.ageGroupMap.get(rawData.citizen_age_group) ||
      rawData.citizen_age_group ||
      t('information_not_available'),
    citizenGroup1Label:
      lookupMaps.citizenGroupMap.get(rawData.citizen_group_1) ||
      rawData.citizen_group_1 ||
      t('information_not_available'),
    citizenGroup2Label:
      lookupMaps.citizenGroupMap.get(rawData.citizen_group_2) ||
      rawData.citizen_group_2 ||
      t('information_not_available'),
    regionLabel:
      lookupMaps.regionMap.get(rawData.administrative_region) ||
      rawData.administrative_region ||
      t('information_not_available'),
    projectLabel:
      lookupMaps.projectMap.get(rawData.project) ||
      rawData.project ||
      t('information_not_available'),
    reporterLabel:
      lookupMaps.userMap.get(rawData.reporter) ||
      rawData.reporter ||
      t('information_not_available'),
    assigneeLabel:
      lookupMaps.userMap.get(rawData.assignee) || rawData.assignee || 'Pending Assignment',

    // Format dates for display
    issueDateFormatted: rawData.issue_date ? new Date(rawData.issue_date).toLocaleDateString() : '',
    intakeDateFormatted: rawData.intake_date
      ? new Date(rawData.intake_date).toLocaleDateString()
      : '',

    // Keep original field values
    issue_type: rawData.issue_type,
    category: rawData.category,
    citizen_age_group: rawData.citizen_age_group,
    citizen_group_1: rawData.citizen_group_1,
    citizen_group_2: rawData.citizen_group_2,
    administrative_region: rawData.administrative_region,
    assignee: rawData.assignee,
    reporter: rawData.reporter,

    // Handle attachments and comments
    attachments: rawData.attachments || [],
    comments: rawData.comments || [],
  };
};

/**
 * useIssueDetail Hook - Centralized state management for IssueDetail
 * Replaces scattered useState calls and manages collapsible sections
 * Follows DRY principle by consolidating detail-related logic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import moment from 'moment';
import {
  createDetailLookupMaps,
  enrichIssueData,
  checkUserAssignment,
  getDisplayValue,
  processSatisfactionData,
  processAppealData,
  processResolutionData,
} from '../utils/issueDetailUtils';

/**
 * Central hook for managing issue detail state
 */
export const useIssueDetail = (issue, lookupData, currentUserId, t) => {
  // ========== STATE MANAGEMENT ==========
  // Collapsible sections state
  const [collapsibleStates, setCollapsibleStates] = useState({
    component: true,
    description: true,
    decision: true,
    satisfaction: true,
    appeal: true,
  });

  // Audio and media state
  const [mediaStates, setMediaStates] = useState({
    sound: null,
    playing: false,
    imageError: false,
  });

  // Comment management state
  const [commentStates, setCommentStates] = useState({
    comments: [],
    newComment: '',
    isUpdating: false,
  });

  // ========== COMPUTED VALUES ==========
  // Create lookup maps (memoized for performance) with stable dependencies
  const lookupMaps = useMemo(() => {
    if (!lookupData) return {};
    return createDetailLookupMaps(lookupData);
  }, [
    lookupData?.categories?.length,
    lookupData?.types?.length,
    lookupData?.statuses?.length,
    lookupData?.ageGroups?.length,
    lookupData?.citizenGroups?.length,
    lookupData?.regions?.length,
    lookupData?.projects?.length,
    lookupData?.users?.length,
  ]);

  // Enrich issue data with lookup labels
  const enrichedIssue = useMemo(
    () => enrichIssueData(issue, lookupMaps, t),
    [issue, lookupMaps, t]
  );

  // Check user assignment
  const isUserAssigned = useMemo(
    () => checkUserAssignment(enrichedIssue, currentUserId),
    [enrichedIssue, currentUserId]
  );

  // Process collapsible content data
  const collapsibleContent = useMemo(() => {
    if (!enrichedIssue) return {};

    return {
      satisfaction: processSatisfactionData(enrichedIssue, t),
      appeal: processAppealData(enrichedIssue, t),
      resolution: processResolutionData(enrichedIssue, t),
    };
  }, [enrichedIssue, t]);

  // Calculate days ago for the issue (memoized to prevent recalculation)
  const issueDaysAgo = useMemo(() => {
    if (!enrichedIssue?.issue_date) return 0;
    return moment().diff(moment(enrichedIssue.issue_date), 'days');
  }, [enrichedIssue?.issue_date]);

  // ========== COLLAPSIBLE MANAGEMENT ==========
  const toggleCollapsible = useCallback((section) => {
    setCollapsibleStates((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  // ========== DISPLAY VALUE HELPERS ==========
  const getSecureDisplayValue = useCallback(
    (value, fallback = t('information_not_available')) =>
      getDisplayValue(value, enrichedIssue, isUserAssigned, fallback),
    [enrichedIssue, isUserAssigned, t]
  );

  // ========== MEDIA MANAGEMENT ==========
  const setPlaying = useCallback((playing) => {
    setMediaStates((prev) => ({ ...prev, playing }));
  }, []);

  const setSound = useCallback((sound) => {
    setMediaStates((prev) => ({ ...prev, sound }));
  }, []);

  const setImageError = useCallback((imageError) => {
    setMediaStates((prev) => ({ ...prev, imageError }));
  }, []);

  // ========== COMMENT MANAGEMENT ==========
  const updateNewComment = useCallback((comment) => {
    setCommentStates((prev) => ({ ...prev, newComment: comment }));
  }, []);

  const setIsUpdating = useCallback((updating) => {
    setCommentStates((prev) => ({ ...prev, isUpdating: updating }));
  }, []);

  const addComment = useCallback(async () => {
    if (!commentStates.newComment || commentStates.isUpdating || !enrichedIssue) {
      return false;
    }

    setIsUpdating(true);

    try {
      const commentDate = moment().toISOString();
      const newCommentObj = {
        comment_by: enrichedIssue.reporter.id,
        comment_text: commentStates.newComment,
        comment_date: commentDate,
      };

      // Update issue comments
      const updatedComments = [...commentStates.comments, newCommentObj];

      setCommentStates((prev) => ({
        ...prev,
        comments: updatedComments,
        newComment: '',
      }));

      // TODO: Implement database save
      console.log('Comment added successfully');

      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [commentStates.newComment, commentStates.isUpdating, commentStates.comments, enrichedIssue]);

  // ========== EFFECTS ==========
  // Initialize comments from enriched issue (only when comments actually change)
  useEffect(() => {
    if (enrichedIssue?.comments && enrichedIssue.comments !== commentStates.comments) {
      setCommentStates((prev) => ({
        ...prev,
        comments: enrichedIssue.comments,
      }));
    }
  }, [enrichedIssue?.comments]);

  // Cleanup audio when component unmounts
  useEffect(
    () => () => {
      if (mediaStates.sound) {
        mediaStates.sound.unloadAsync();
      }
    },
    [mediaStates.sound]
  );

  // ========== RETURN API ==========
  return {
    // Enriched data
    enrichedIssue,
    isUserAssigned,
    issueDaysAgo,
    lookupMaps,

    // Collapsible management
    collapsibleStates,
    collapsibleContent,
    toggleCollapsible,

    // Display helpers
    getSecureDisplayValue,

    // Media management
    mediaStates,
    setPlaying,
    setSound,
    setImageError,

    // Comment management
    commentStates,
    updateNewComment,
    addComment,
    setIsUpdating,

    // Utility functions
    isContentConfidential:
      enrichedIssue && isUserAssigned ? false : enrichedIssue?.citizen_type === 1,
  };
};

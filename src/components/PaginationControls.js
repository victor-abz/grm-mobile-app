import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../utils/colors';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: colors.lightgray,
  },
  countText: {
    fontSize: 13,
    color: colors.secondary,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginBottom: 12,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightgray,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  pageButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pageButtonDisabled: {
    backgroundColor: colors.lightgray,
    borderColor: colors.disabled,
  },
  pageButtonText: {
    fontSize: 14,
    color: colors.secondary,
    fontFamily: 'Poppins_500Medium',
  },
  pageButtonTextActive: {
    color: colors.white,
  },
  pageButtonTextDisabled: {
    color: colors.disabled,
  },
  ellipsis: {
    fontSize: 14,
    color: colors.secondary,
    marginHorizontal: 8,
    fontFamily: 'Poppins_400Regular',
  },
});

const PaginationControls = ({ pagination, onPreviousPage, onNextPage, onGoToPage }) => {
  if (!pagination || pagination.totalCount === 0) {
    return null;
  }

  const { currentPage, totalPages, hasNextPage, hasPreviousPage } = pagination;

  // Generate page numbers to display
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5; // Show at most 5 page numbers

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 3) {
      // Show: 1, 2, 3, ..., last
      pages.push(1, 2, 3);
      if (totalPages > 4) {
        pages.push('...');
      }
      if (totalPages > 3) {
        pages.push(totalPages);
      }
    } else if (currentPage >= totalPages - 2) {
      // Show: 1, ..., last-2, last-1, last
      pages.push(1);
      if (totalPages > 4) {
        pages.push('...');
      }
      for (let i = totalPages - 2; i <= totalPages; i++) {
        if (i > 1) pages.push(i);
      }
    } else {
      // Show: 1, ..., current-1, current, current+1, ..., last
      pages.push(1);
      pages.push('...');
      pages.push(currentPage - 1, currentPage, currentPage + 1);
      pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const pageNumbers = generatePageNumbers();

  const handlePagePress = (page) => {
    if (typeof page === 'number' && page !== currentPage) {
      if (onGoToPage) {
        onGoToPage(page);
      } else if (page > currentPage) {
        for (let i = currentPage; i < page; i++) {
          onNextPage();
        }
      } else {
        for (let i = currentPage; i > page; i--) {
          onPreviousPage();
        }
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Pagination Controls */}
      <View style={styles.paginationContainer}>
        {/* Previous Button */}
        <TouchableOpacity
          style={[styles.pageButton, !hasPreviousPage && styles.pageButtonDisabled]}
          onPress={onPreviousPage}
          disabled={!hasPreviousPage}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={18}
            color={hasPreviousPage ? colors.secondary : colors.disabled}
          />
        </TouchableOpacity>

        {/* Page Numbers */}
        {pageNumbers.map((page) => {
          if (page === '...') {
            // Use a unique key for ellipsis based on position and currentPage
            return (
              <Text
                key={`ellipsis-${currentPage}-${page}-${Math.random().toString(36).slice(2, 8)}`}
                style={styles.ellipsis}
              >
                ...
              </Text>
            );
          }

          const isActive = page === currentPage;

          return (
            <TouchableOpacity
              key={`page-${page}`}
              style={[styles.pageButton, isActive && styles.pageButtonActive]}
              onPress={() => handlePagePress(page)}
              disabled={isActive}
            >
              <Text style={[styles.pageButtonText, isActive && styles.pageButtonTextActive]}>
                {page}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Next Button */}
        <TouchableOpacity
          style={[styles.pageButton, !hasNextPage && styles.pageButtonDisabled]}
          onPress={onNextPage}
          disabled={!hasNextPage}
        >
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={hasNextPage ? colors.secondary : colors.disabled}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PaginationControls;

/**
 * CollapsibleSection Component - Reusable collapsible section
 * Eliminates repetitive TouchableOpacity/Collapsible patterns
 * Provides consistent styling and behavior across collapsible sections
 */

import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Collapsible from 'react-native-collapsible';
import { colors } from '../utils/colors';

const CollapsibleSection = ({
  title,
  isCollapsed,
  onToggle,
  children,
  triggerStyle = {},
  contentStyle = {},
  showContent = true,
  emptyStateText,
}) => {
  const { t } = useTranslation();
  const defaultEmptyStateText = t('No information available');

  return (
    <>
      <TouchableOpacity
        onPress={onToggle}
        style={[
          {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 10,
            paddingHorizontal: 5,
          },
          triggerStyle,
        ]}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.primary,
            fontFamily: 'Poppins_500Medium',
          }}
        >
          {title}
        </Text>
        <MaterialCommunityIcons
          name={isCollapsed ? 'chevron-down-circle' : 'chevron-up-circle'}
          size={24}
          color={colors.primary}
        />
      </TouchableOpacity>

      <Collapsible collapsed={isCollapsed}>
        <View
          style={[
            {
              paddingHorizontal: 10,
              paddingVertical: 15,
              backgroundColor: '#f9f9f9',
              borderRadius: 8,
              marginBottom: 10,
            },
            contentStyle,
          ]}
        >
          {showContent ? (
            children
          ) : (
            <Text
              style={{
                fontStyle: 'italic',
                color: colors.secondary,
                textAlign: 'center',
                fontSize: 14,
              }}
            >
              {emptyStateText || defaultEmptyStateText}
            </Text>
          )}
        </View>
      </Collapsible>
    </>
  );
};

export default CollapsibleSection;

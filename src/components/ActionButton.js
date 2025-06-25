/**
 * ActionButton Component - Reusable action button
 * Eliminates repetitive TouchableOpacity/Icon patterns
 * Provides consistent styling and behavior across action buttons
 */

import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { AntDesign, Feather } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { styles } from '../screens/Home/IssueActions/containers/Content.styles';

const ActionButton = ({
  title,
  onPress,
  enabled = true,
  showHelpIcon = true,
  maxTitleLength = 28,
  testID,
  style = {},
}) => {
  const displayTitle =
    title.length > maxTitleLength ? `${title.substring(0, maxTitleLength)}...` : title;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!enabled}
      style={[
        {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginVertical: 10,
        },
        style,
      ]}
      testID={testID}
    >
      <Text style={styles.subtitle}>{displayTitle}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <AntDesign
          style={{ marginRight: 5 }}
          name="rightsquare"
          size={35}
          color={enabled ? colors.primary : colors.disabled}
        />
        {showHelpIcon && <Feather name="help-circle" size={24} color="gray" />}
      </View>
    </TouchableOpacity>
  );
};

export default ActionButton;

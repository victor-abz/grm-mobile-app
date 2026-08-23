import { AntDesign, Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, TouchableOpacity, View, Text } from 'react-native';
import { colors } from '../../../../utils/colors';
import { styles } from '../containers/Content.styles';
import { i18n } from '../../../../translations/i18n';
import Tooltip from '../../../../components/Tooltip/Tooltip';

type Props = {
  label: string,
  tooltipLabel?: string,
  onShowDialog: () => void,
  isEnabled: boolean,
};

export default function ActionButton({ label, tooltipLabel, onShowDialog, isEnabled }: Props) {
  const isSmallLongText = label.length > 28 && Dimensions.get('screen').width < 375;
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)

  return (
    <View>
      <View
        disabled={!isEnabled}
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginVertical: 10,
          padding: label === i18n.t('escalate') ? 15 : 0,
        }}
      >
        <Text style={[styles.subtitle, isSmallLongText && { fontSize: 14 }]}>
          {isSmallLongText ? `${label.substring(0, 14)}${'\n'}${label.substring(15)}` : label}
        </Text>

        {isTooltipVisible && <Tooltip label={tooltipLabel} visible={true}/>}

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={onShowDialog}>
            <AntDesign
              style={{ marginRight: 5 }}
              name="rightsquare"
              size={35}
              color={isEnabled ? colors.primary : colors.disabled}
            />
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!tooltipLabel}
            onPress={() => {
              setIsTooltipVisible(!isTooltipVisible);
            }}
          >
            <Feather name="help-circle" size={24} color="gray" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

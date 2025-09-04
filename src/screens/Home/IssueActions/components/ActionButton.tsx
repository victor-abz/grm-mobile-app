import { AntDesign, Feather } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { colors } from '../../../../utils/colors';
import { styles } from '../containers/Content.styles';
import { i18n } from '../../../../translations/i18n';

type Props = {
  label: string,
  onShowDialog: () => void,
  isEnabled: boolean,
};

export default function ActionButton({ label, onShowDialog, isEnabled }: Props) {
  return (
    <TouchableOpacity
      onPress={onShowDialog}
      disabled={!isEnabled}
      style={{
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 10,
        padding: label === i18n.t('escalate') ? 15 : 0
      }}
    >
      <Text style={styles.subtitle}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <AntDesign
          style={{ marginRight: 5 }}
          name="rightsquare"
          size={35}
          color={isEnabled ? colors.primary : colors.disabled}
        />
        <Feather name="help-circle" size={24} color="gray" />
      </View>
    </TouchableOpacity>
  );
}

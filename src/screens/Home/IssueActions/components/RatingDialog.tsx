import React from 'react';
import { View, Text } from 'react-native';
import { Portal, Dialog, Paragraph, Button, RadioButton } from 'react-native-paper';
import { i18n } from '../../../../translations/i18n';
import { styles } from '../containers/Content.styles';
import { colors } from '../../../../utils/colors';

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: '#dedede',
    text: '#707070',
  },
};

type Props = {
  visible: boolean;
  onDismiss: () => void;
  rating: number;
  setRating: React.Dispatch<React.SetStateAction<number>>;
  onSubmit: () => void;
};

const RatingDialog = ({ visible: ratingDialog, onDismiss: _hideRatingDialog, rating, setRating, onSubmit: rateIssue }: Props) => {
  return (
    <Portal>
      <Dialog visible={ratingDialog} onDismiss={_hideRatingDialog}>
        <Dialog.Title>{i18n.t('rating')}?</Dialog.Title>
        <Dialog.Content>
          <Paragraph>{i18n.t('rate_issue')}</Paragraph>
          <RadioButton.Group
            onValueChange={(newValue) => {
              if (newValue === rating) {
                setRating(0);
              } else {
                setRating(newValue);
              }
            }}
            value={rating}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 5,
              }}
            >
              <RadioButton.Android value={5} uncheckedColor="#dedede" color={colors.primary} />
              <Text style={styles.radioLabel}>{i18n.t('satisfaction_level_5')} </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 5,
              }}
            >
              <RadioButton.Android value={4} uncheckedColor="#dedede" color={colors.primary} />
              <Text style={styles.radioLabel}>{i18n.t('satisfaction_level_4')} </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 5,
              }}
            >
              <RadioButton.Android value={3} uncheckedColor="#dedede" color={colors.primary} />
              <Text style={styles.radioLabel}>{i18n.t('satisfaction_level_3')} </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 5,
              }}
            >
              <RadioButton.Android value={2} uncheckedColor="#dedede" color={colors.primary} />
              <Text style={styles.radioLabel}>{i18n.t('satisfaction_level_2')} </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 5,
              }}
            >
              <RadioButton.Android value={1} uncheckedColor="#dedede" color={colors.primary} />
              <Text style={styles.radioLabel}>{i18n.t('satisfaction_level_1')} </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 5,
              }}
            >
              <RadioButton.Android value={0} uncheckedColor="#dedede" color={colors.primary} />
              <Text style={styles.radioLabel}>{i18n.t('satisfaction_level_0')} </Text>
            </View>
          </RadioButton.Group>
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            theme={theme}
            style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
            labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
            mode="contained"
            onPress={_hideRatingDialog}
          >
            {i18n.t('cancel')}
          </Button>
          <Button
            theme={theme}
            style={{ alignSelf: 'center', margin: 24 }}
            labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
            mode="contained"
            onPress={rateIssue}
          >
            {i18n.t('save_button_text')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default RatingDialog;

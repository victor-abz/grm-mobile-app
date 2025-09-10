import React, { ReactNode } from 'react';
import { Button, Dialog, Paragraph, Portal } from 'react-native-paper';
import { i18n } from '../../../../translations/i18n';
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
  onSubmit: () => void;
};

const AppealDialog = ({ visible: isEnabled, onDismiss, onSubmit }: Props) => {
  return (
    <Portal>
      <Dialog visible={isEnabled} onDismiss={onDismiss}>
        <Dialog.Title>{`${i18n.t('confirmation')}?`}</Dialog.Title>
        <Dialog.Content>
          <Paragraph>{i18n.t('confirm_your_choice')}</Paragraph>
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            theme={theme}
            style={{
              alignSelf: 'center',
              backgroundColor: '#E74C3C',
              paddingLeft: 15,
              paddingRight: 15,
            }}
            labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
            mode="contained"
            onPress={onDismiss}
          >
            {i18n.t('no')}
          </Button>
          <Button
            theme={theme}
            style={{ alignSelf: 'center', margin: 24, paddingLeft: 15, paddingRight: 15 }}
            labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
            mode="contained"
            onPress={onSubmit}
          >
            {i18n.t('yes')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default AppealDialog;

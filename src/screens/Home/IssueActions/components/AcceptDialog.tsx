import React from 'react';
import { Portal, Dialog, Paragraph, Button, RadioButton } from 'react-native-paper';
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
  acceptedDialogVisible: boolean;
  _showRejectDialog: () => void;
  onSubmit: () => void;
};

const AcceptDialog = ({
  visible: acceptDialog,
  onDismiss: _hideDialog,
  acceptedDialogVisible: acceptedDialog,
  _showRejectDialog,
  onSubmit: acceptIssue,
}: Props) => {
  return (
    <Portal>
      <Dialog visible={acceptDialog} onDismiss={_hideDialog}>
        {!acceptedDialog && <Dialog.Title>{i18n.t('accept_issue')}?</Dialog.Title>}
        <Dialog.Content>
          {!acceptedDialog ? (
            <Paragraph>{i18n.t('are_you_accepting')}</Paragraph>
          ) : (
            <Paragraph>{i18n.t('you_have_accepted')}</Paragraph>
          )}
        </Dialog.Content>
        {!acceptedDialog ? (
          <Dialog.Actions>
            <Button
              theme={theme}
              style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={_showRejectDialog}
            >
              {i18n.t('reject')}
            </Button>
            <Button
              theme={theme}
              style={{ alignSelf: 'center', margin: 24 }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={acceptIssue}
            >
              {i18n.t('accept')}
            </Button>
          </Dialog.Actions>
        ) : (
          <Dialog.Actions>
            <Button
              theme={theme}
              style={{ alignSelf: 'center', margin: 24 }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={_hideDialog}
            >
              {i18n.t('finished')}
            </Button>
          </Dialog.Actions>
        )}
      </Dialog>
    </Portal>
  );
};

export default AcceptDialog;

import React from 'react';
import { View } from 'react-native';
import { Portal, Dialog, Paragraph, TextInput, Button } from 'react-native-paper';
import { i18n } from '../../../../translations/i18n';
import AddAttachmentCard from '../../GRM/components/AddAttachmentCard';
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
  rejectedDialog: boolean;
  reason: string;
  onChangeReason: ((text: string) => void) & Function;
  attachment: unknown;
  setAttachment: (value: React.SetStateAction<{}>) => void
  setRecordingURI: (value: (prevState: undefined) => undefined) => void
  onDismiss: () => void;
  onSubmit: () => void;
};

const RejectDialog = ({
  visible,
  rejectedDialog,
  reason,
  onChangeReason,
  setAttachment,
  setRecordingURI,
  onDismiss,
  onSubmit,
}: Props) => {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Content>
          {!rejectedDialog ? (
            <Paragraph>{i18n.t('you_are_rejecting')}</Paragraph>
          ) : (
            <Paragraph>{i18n.t('complaint_rejected')}</Paragraph>
          )}
          {!rejectedDialog && (
            <View>
              <TextInput
                multiline
                style={{ marginTop: 10 }}
                mode="outlined"
                theme={theme}
                onChangeText={onChangeReason}
                value={reason}
              />
              
              <AddAttachmentCard
                theme={theme}
                onAttachmentChange={(a, r) => {
                  setAttachment(a);
                  setRecordingURI(r);
                }}
              />
            </View>
          )}
        </Dialog.Content>
        {!rejectedDialog ? (
          <Dialog.Actions>
            <Button
              theme={theme}
              style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={onDismiss}
            >
              {i18n.t('cancel')}
            </Button>
            <Button
              disabled={reason === ''}
              theme={theme}
              style={{ alignSelf: 'center', margin: 24 }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={onSubmit}
            >
              {i18n.t('submit')}
            </Button>
          </Dialog.Actions>
        ) : (
          <Dialog.Actions>
            <Button
              theme={theme}
              style={{ alignSelf: 'center', margin: 24 }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={onDismiss}
            >
              {i18n.t('finished')}
            </Button>
          </Dialog.Actions>
        )}
      </Dialog>
    </Portal>
  );
};

export default RejectDialog;

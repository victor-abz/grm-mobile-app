import React from 'react';
import { Portal, Dialog, Paragraph, Button, TextInput } from 'react-native-paper';
import { i18n } from '../../../../translations/i18n';
import { colors } from '../../../../utils/colors';
import AddAttachmentCard from '../../GRM/components/AddAttachmentCard';

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
  escalatedDialog: boolean;
  onChangeEscalateComment: React.Dispatch<React.SetStateAction<string>>;
  setAttachment: React.Dispatch<React.SetStateAction<{}>>;
  setRecordingURI: React.Dispatch<(prevState: undefined) => undefined>;
  escalateComment: string;
  onSubmit: () => void;
  setEscalatedDialog: React.Dispatch<React.SetStateAction<boolean>>;
};

const EscalateDialog = ({
  visible: escalateDialog,
  onDismiss: _hideEscalateDialog,
  escalatedDialog,
  onChangeEscalateComment,
  setAttachment,
  setRecordingURI,
  escalateComment,
  onSubmit: escalateIssue,
  setEscalatedDialog,
}: Props) => {
  return (
    <Portal>
      <Dialog visible={escalateDialog} onDismiss={_hideEscalateDialog}>
        <Dialog.Content>
          {!escalatedDialog ? (
            <Paragraph>{i18n.t('you_are_escalating')}</Paragraph>
          ) : (
            <Paragraph>{i18n.t('escalated_text')}</Paragraph>
          )}
          {!escalatedDialog && (
            <TextInput
              multiline
              style={{ marginTop: 10 }}
              mode="outlined"
              theme={theme}
              onChangeText={onChangeEscalateComment}
            />
          )}
          <AddAttachmentCard
            theme={theme}
            onAttachmentChange={(a, r) => {
              setAttachment(a);
              setRecordingURI(r);
            }}
          />
        </Dialog.Content>
        {!escalatedDialog ? (
          <Dialog.Actions>
            <Button
              theme={theme}
              style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={_hideEscalateDialog}
            >
              {i18n.t('cancel')}
            </Button>
            <Button
              disabled={escalateComment === ''}
              theme={theme}
              style={{ alignSelf: 'center', margin: 24 }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={escalateIssue}
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
              onPress={() => {
                _hideEscalateDialog();
                setEscalatedDialog(false);
              }}
            >
              {i18n.t('finished')}
            </Button>
          </Dialog.Actions>
        )}
      </Dialog>
    </Portal>
  );
};

export default EscalateDialog;

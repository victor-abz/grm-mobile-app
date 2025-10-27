import React from 'react';
import { Text } from 'react-native';
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
  recordedResolution: boolean;
  onChangeResolution: React.Dispatch<React.SetStateAction<string>>;
  resolution: string;
  setAttachment: React.Dispatch<React.SetStateAction<{}>>;
  setRecordingURI: React.Dispatch<(prevState: undefined) => undefined>;
  recordResolution: () => void;
  setRecordedResolution: React.Dispatch<React.SetStateAction<boolean>>;
  onSubmit: () => void;
};

const RecordResolutionDialog = ({
  visible: recordResolutionDialog,
  onDismiss: _hideRecordResolutionDialog,
  recordedResolution,
  onChangeResolution,
  resolution,
  setAttachment,
  setRecordingURI,
  recordResolution,
  setRecordedResolution,
  onSubmit: recordResolutionConfirmation,
}: Props) => {
  return (
    <Portal>
      <Dialog visible={recordResolutionDialog} onDismiss={_hideRecordResolutionDialog}>
        <Dialog.Content>
          {!recordedResolution ? (
            <Paragraph>{i18n.t('summarize_resolution')}</Paragraph>
          ) : (
            <Paragraph>{i18n.t('please_confirm_resolution')}</Paragraph>
          )}
          {!recordedResolution ? (
            <TextInput
              multiline
              style={{ marginTop: 10 }}
              mode="outlined"
              theme={theme}
              onChangeText={onChangeResolution}
            />
          ) : (
            <Text>
              {'\n'}"{resolution}"
            </Text>
          )}
          <AddAttachmentCard
            theme={theme}
            onAttachmentChange={(a, r) => {
              setAttachment(a);
              setRecordingURI(r);
            }}
          />
        </Dialog.Content>
        {!recordedResolution ? (
          <Dialog.Actions>
            <Button
              theme={theme}
              style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={_hideRecordResolutionDialog}
            >
              {i18n.t('cancel')}
            </Button>
            <Button
              disabled={resolution === ''}
              theme={theme}
              style={{ alignSelf: 'center', margin: 24 }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={recordResolution}
            >
              {i18n.t('submit')}
            </Button>
          </Dialog.Actions>
        ) : (
          <Dialog.Actions>
            <Button
              theme={theme}
              style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={() => setRecordedResolution(false)}
            >
              {i18n.t('cancel')}
            </Button>
            <Button
              theme={theme}
              style={{ alignSelf: 'center', margin: 24 }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={recordResolutionConfirmation}
            >
              {i18n.t('confirm')}
            </Button>
          </Dialog.Actions>
        )}
      </Dialog>
    </Portal>
  );
};

export default RecordResolutionDialog;

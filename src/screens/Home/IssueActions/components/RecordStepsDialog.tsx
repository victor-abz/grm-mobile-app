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
  recordedSteps: boolean;
  onChangeComment: React.Dispatch<React.SetStateAction<string>>;
  setAttachment: React.Dispatch<React.SetStateAction<{}>>;
  setRecordingURI: React.Dispatch<(prevState: undefined) => undefined>;
  comment: string;
  onSubmit: () => void;
  setRecordedSteps: React.Dispatch<React.SetStateAction<boolean>>;
};

const RecordStepsDialog = ({
  visible: recordStepsDialog,
  onDismiss: _hideRecordStepsDialog,
  recordedSteps,
  onChangeComment,
  setAttachment,
  setRecordingURI,
  comment,
  onSubmit: recordStep,
  setRecordedSteps,
}: Props) => {
  return (
    <Portal>
      <Dialog visible={recordStepsDialog} onDismiss={_hideRecordStepsDialog}>
        <Dialog.Content>
          {!recordedSteps ? (
            <Paragraph>{i18n.t('record_steps_text')}</Paragraph>
          ) : (
            <Paragraph>{i18n.t('recorded_comment')}</Paragraph>
          )}
          {!recordedSteps && (
            <TextInput
              multiline
              style={{ marginTop: 10 }}
              mode="outlined"
              theme={theme}
              onChangeText={onChangeComment}
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
        {!recordedSteps ? (
          <Dialog.Actions>
            <Button
              theme={theme}
              style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={_hideRecordStepsDialog}
            >
              {i18n.t('cancel')}
            </Button>
            <Button
              disabled={comment === ''}
              theme={theme}
              style={{ alignSelf: 'center', margin: 24 }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={recordStep}
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
                _hideRecordStepsDialog();
                setRecordedSteps(false);
              }}
            >
              {i18n.t('finished')}
            </Button>
            {/* <Button
                  theme={theme}
                  style={{ alignSelf: 'center', margin: 24 }}
                  labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                  mode="contained"
                  onPress={goToHistory}
                >
                  {i18n.t('view_history')}
                </Button> */}
          </Dialog.Actions>
        )}
      </Dialog>
    </Portal>
  );
};

export default RecordStepsDialog;

import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import CrowdImage from '../../../../../assets/crowd.svg';
import { colors } from '../../../../utils/colors';
import { styles } from './Content.styles';
import { withObservables } from '@nozbe/watermelondb/react';
import CustomDropDownPicker from '../../../../components/CustomDropDownPicker/CustomDropDownPicker';
import watermelonManager from '../../../../database/watermelonManager';

const screenWidth = Dimensions.get('window').width;

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: '#dedede',
    text: '#707070',
  },
};

function Content({ projects = [] }) {
  const { t } = useTranslation();
  const navigation = useNavigation();

  // Prepare project items for dropdown
  const projectItems = useMemo(() => {
    return projects
      .filter((p) => p && p.id)
      .map((p) => ({ label: p.title || p.projectCode || p.id, value: p.id, _model: p }));
  }, [projects]);

  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : null}>
        <View style={{ padding: 23 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <CrowdImage height={90} width={screenWidth * 0.3} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.title}>{t('welcome_citizen_input')}</Text>
            </View>
          </View>
          <Text style={styles.stepNote}>{t('intro_text_0')}</Text>
          <Text style={[styles.stepNote]}>{t('intro_text_1')}</Text>
          <Text style={styles.stepNote}>{t('intro_text_2')}</Text>
          <Text style={styles.stepNote}>{t('intro_text_3')}</Text>
          <Text style={styles.stepNote}>{t('intro_text_4')}</Text>
          <Text style={styles.stepNote}>{t('intro_text_5')}</Text>

          {/* Project selection */}
          {projectItems.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={[styles.stepNote, { marginBottom: 8 }]}> {t('select_project')}</Text>
              <CustomDropDownPicker
                placeholder={t('select_project_placeholder')}
                items={projectItems}
                value={selectedProjectId}
                setPickerValue={setSelectedProjectId}
                schema={{ label: 'label', value: 'value' }}
              />
            </View>
          )}
          <Text style={styles.stepNote}>{t('intro_text_6')}</Text>
        </View>

        <View style={{ paddingHorizontal: 50 }}>
          <Button
            theme={theme}
            style={{ alignSelf: 'center', margin: 0 }}
            labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
            mode="contained"
            disabled={!selectedProject}
            onPress={() => {
              if (selectedProject) {
                navigation.navigate('CitizenReport', { selectedProject });
              }
            }}
          >
            {t('next')}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

// Enhance with observables for projects list
const enhance = withObservables([], () => ({
  projects: watermelonManager.getDatabase().get('grm_projects').query().observe(),
}));

export default enhance(Content);

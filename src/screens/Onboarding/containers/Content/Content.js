import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Button, Title } from 'react-native-paper';
import { styles } from './Content.style';
// import { PreferencesContext } from "@providers/PreferencesProvider/PreferencesContext";
import { logger } from '../../../../utils/logger';
import ThinkingSVG from '../../../../../assets/think.svg';
import LanguageSelector from '../../../../translations/TranslationComponent';

const Content = () => {
  const { t } = useTranslation();

  const customStyles = styles();
  const navigation = useNavigation();

  // Log screen load
  useEffect(() => {
    logger.userAction('screen_load', 'Onboarding');
  }, []);

  return (
    <View style={customStyles.content}>
      {/* <MapBg */}
      {/*  width={320} */}
      {/*  style={{ */}
      {/*    position: "absolute", */}
      {/*    top: -10, */}
      {/*    left: 20, */}
      {/*    bottom: 0, */}
      {/*  }} */}
      {/* /> */}

      <View>{/* <EADLLogo height={90} width={180} style={{ marginTop: 100 }} /> */}</View>
      {/* </ImageBackground> */}
      <View>
        <ThinkingSVG />
      </View>
      {/* <Title style={customStyles.upperTitle}>Welcome to EADL</Title> */}
      <View>
        <Title style={customStyles.title}>{t('used_app_before')}</Title>
      </View>

      <View style={customStyles.buttonsView}>
        <Button
          style={[customStyles.button, { backgroundColor: '#24c38b' }]}
          mode="contained"
          onPress={() => {
            logger.userAction('onboarding_existing_user', 'Onboarding');
            navigation.navigate('AuthStack', { screen: 'Login' });
          }}
        >
          {t('yes')}
        </Button>
        <Button
          style={[customStyles.button, { backgroundColor: '#ff5722' }]}
          mode="contained"
          onPress={() => {
            logger.userAction('onboarding_new_user', 'Onboarding');
            navigation.navigate('AuthStack', { screen: 'SignUp' });
          }}
        >
          {t('no')}
        </Button>
      </View>
      <LanguageSelector />
      <View>
        <Text>V:1.0.1</Text>
      </View>
    </View>
  );
};

export default Content;

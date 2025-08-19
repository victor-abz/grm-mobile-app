import { useState } from 'react';
import { version } from '../../../../package.json';
import {
  Keyboard,
  Text,
  View,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { ActivityIndicator, Button, TextInput } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { Controller, useForm } from 'react-hook-form';
import { login, logout } from '../../../store/ducks/authentication.duck';
import EADLLogo from '../../../../assets/eadl-logo.svg';
import styles from './Login.style';
import MESSAGES from '../../../utils/formErrorMessages';
import { emailRegex, passwordRegex } from '../../../utils/formUtils';
import { fetchAuthCredentials, getCouchDBCredentials } from '../../../services/authService';
import { i18n } from "../../../translations/i18n";
import { colors } from '../../../utils/colors';
import { DB_VERSION } from "../../../services/shared/SyncService";
import { removeEncryptedValue } from '../../../utils/storageManager';

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: '#dedede',
    text: '#707070',
  },
};

function Login()
{
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [isPasswordSecure, setIsPasswordSecure] = useState(true);
  const [responseError, setResponseError] = useState();

  const onLoginPress = async (data) =>
  {
    setResponseError(null);
    setLoading(true);
    const response = await fetchAuthCredentials({ username: data?.email, password: data?.password })
        
    if (response.error) {
      setResponseError(response.error);
      setLoading(false);
      return;
    }

    //
    //TODO: Delete after migrating to the new services, used for debugging purposes with old data.
    let dbConfig;
    try {
       dbConfig = await getEncryptedData(
        `dbCredentials_${data?.password}_${data?.email.replace('@', '')}`
      );
    } catch (error) {
      console.log("OK: not storing sensitive local user credentials used in combination with pouchdb");  
    }
    try { 
      if (!dbConfig) {
        dbConfig = await getEncryptedData(
          `dbCredentials_${data?.email.replace('@', '')}`
        );
      }
      
    } catch (error) {
      dispatch(logout());
      console.warn("Proceeding fetch CouchDB credentials from remote - locally not available");  
    }
    removeEncryptedValue(
        `dbCredentials_${data?.password}_${data?.email.replace('@', '')}`
      )
    //
    //

    if (dbConfig) {
      dispatch(login(response, { email: data?.email, password: data?.password }, dbConfig));
      return;
    } //TODO: Delete after migrating to the new services, used for debugging purposes with old data.

    const couchDBCredentialsResponse = await getCouchDBCredentials({
      email: data?.email,
      password: data?.password
    }) //TODO: Delete after migrating to the new services, used for debugging purposes with old data.
    

    setLoading(false);
    dispatch(login(
      response,
      data, //TODO: Delete after migrating to the new services, used for debugging purposes with old data.
      couchDBCredentialsResponse //TODO: Delete after migrating to the new services, used for debugging purposes with old data.
    ));
  };

  const { control, handleSubmit, errors } = useForm({
    criteriaMode: 'all',
  });

  return (
    <ScrollView
      style={{
        backgroundColor: 'white',
        flex: 1,
        paddingBottom: 30,
        paddingHorizontal: 30,
      }}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <KeyboardAvoidingView style={styles.containerView} behavior="position">
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          {/* <MapBg */}
          {/*  width={220} */}
          {/*  height={190} */}
          {/*  style={{ */}
          {/*    marginTop: -50, */}
          {/*  }} */}
          {/* /> */}
        </View>

        <View style={{ marginBottom: 50, marginTop: 70, alignItems: 'center' }}>
          <EADLLogo height={90} width={180} />
          <Text
            style={{
              marginBottom: 15,
              fontFamily: 'Poppins_400Regular',
              fontSize: 19,
              fontWeight: 'bold',
              fontStyle: 'normal',
              lineHeight: 23,
              letterSpacing: 0,
              textAlign: 'center',
              color: '#707070',
            }}
          >
            {i18n.t('welcome_login')}
          </Text>
        </View>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.loginScreenContainer}>
            <KeyboardAvoidingView style={styles.containerView} behavior="padding">
              <View style={styles.formContainer}>
                <View style={{ borderRadius: 10, marginBottom: 16 }}>
                  <Controller
                    control={control}
                    render={({ onChange, onBlur, value }) => (
                      <TextInput
                        theme={theme}
                        autoCapitalize="none"
                        label={i18n.t('email')}
                        mode="outlined"
                        labelColor="#dedede"
                        style={styles.loginFormTextInput}
                        left={<TextInput.Icon name="account" color="#24c38b" />}
                        onBlur={onBlur}
                        onChangeText={(value) => onChange(value)}
                        value={value}
                      />
                    )}
                    name="email"
                    rules={{
                      required: {
                        value: true,
                        message: MESSAGES.required,
                      },
                      pattern: {
                        value: emailRegex,
                        message: 'Please enter a valid email address',
                      },
                    }}
                    defaultValue=""
                  />
                  {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
                  <Controller
                    control={control}
                    render={({ onChange, onBlur, value }) => (
                      <TextInput
                        theme={theme}
                        mode="outlined"
                        placeholderColor="#dedede"
                        label={i18n.t('password')}
                        style={styles.loginFormTextInput}
                        left={
                          <TextInput.Icon
                            onPress={() => setIsPasswordSecure(!isPasswordSecure)}
                            name={isPasswordSecure ? 'eye-off-outline' : 'eye-outline'}
                            color="#24c38b"
                          />
                        }
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        secureTextEntry={isPasswordSecure}
                      />
                    )}
                    name="password"
                    rules={{
                      required: {
                        value: true,
                        message: MESSAGES.required,
                      },
                      minLength: {
                        value: 8,
                        message: MESSAGES.minLength,
                      },
                      pattern: {
                        value: passwordRegex,
                        message: MESSAGES.password,
                      },
                      maxLength: {
                        value: 40,
                        message: MESSAGES.maxLength,
                      },
                    }}
                    defaultValue=""
                  />
                  {errors.password && (
                    <Text style={styles.errorText}>{errors.password.message}</Text>
                  )}
                </View>

                {/* <TouchableOpacity style={styles.hintContainer}> */}
                {/*  <Text style={styles.textHint}>Forgo?</Text> */}
                {/* </TouchableOpacity> */}
              </View>
              {responseError && <Text style={styles.errorText}>{responseError}</Text>}
            </KeyboardAvoidingView>
            {loading ? (
              <ActivityIndicator size="large" color="#24c38b" />
            ) : (
              <Button
                theme={theme}
                style={[
                  styles.loginButton,
                  {
                    backgroundColor: errors ? '#24c38b' : '#dedede',
                  },
                ]}
                onPress={handleSubmit(onLoginPress)}
                color="white"
              >
                {i18n.t('connect')}
              </Button>
            )}
          </View>
        </TouchableWithoutFeedback>

      </KeyboardAvoidingView>
      <View style={{ marginTop: "auto" }}>
           <Text style={{ color: colors.secondary, fontSize: 12, textAlign: "center" }}>
              v {version} - {DB_VERSION}
           </Text>
      </View>
    </ScrollView>
  );
}

export default Login;

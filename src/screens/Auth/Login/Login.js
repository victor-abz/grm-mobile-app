import React, { useState, useContext } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { ActivityIndicator, Button, TextInput } from 'react-native-paper';
import { AuthContext } from '../../../providers/AuthProvider';
import { colors } from '../../../utils/colors';
import MESSAGES from '../../../utils/formErrorMessages';
import styles from './Login.style';

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: colors.placeholder,
    text: '#707070',
  },
};

function Login() {
  const { t } = useTranslation();
  const { login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [isPasswordSecure, setIsPasswordSecure] = useState(true);
  const [error, setError] = useState('');

  const onLoginPress = async (data) => {
    setLoading(true);
    setError('');
    try {
      const success = await login(data.login, data.password);
      if (!success) {
        setError(t('invalid_credentials'));
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(t('login_error'));
    } finally {
      setLoading(false);
    }
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
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
          {/* <EADLLogo height={90} width={180} /> */}
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
            {t('welcome_login')}
          </Text>
        </View>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.loginScreenContainer}>
            <KeyboardAvoidingView style={styles.containerView} behavior="padding">
              <View style={styles.formContainer}>
                <View style={{ borderRadius: 10, marginBottom: 16 }}>
                  <Controller
                    control={control}
                    name="login"
                    defaultValue=""
                    rules={{
                      required: {
                        value: true,
                        message: MESSAGES.required,
                      },
                    }}
                    render={({ field }) => (
                      <TextInput
                        theme={theme}
                        autoCapitalize="none"
                        label={t('login_identifier')}
                        mode="outlined"
                        placeholderTextColor={colors.placeholder}
                        style={styles.loginFormTextInput}
                        left={<TextInput.Icon name="account" color="#24c38b" />}
                        onBlur={field.onBlur}
                        onChangeText={field.onChange}
                        value={field.value}
                        placeholder={t('login_identifier_placeholder')}
                      />
                    )}
                  />
                  {errors.login && <Text style={styles.errorText}>{errors.login.message}</Text>}
                  <Controller
                    control={control}
                    name="password"
                    defaultValue=""
                    rules={{
                      required: {
                        value: true,
                        message: MESSAGES.required,
                      },
                      maxLength: {
                        value: 40,
                        message: MESSAGES.maxLength,
                      },
                    }}
                    render={({ field }) => (
                      <TextInput
                        theme={theme}
                        mode="outlined"
                        placeholderTextColor={colors.placeholder}
                        label={t('password')}
                        style={styles.loginFormTextInput}
                        left={
                          <TextInput.Icon
                            onPress={() => setIsPasswordSecure(!isPasswordSecure)}
                            name={isPasswordSecure ? 'eye-off-outline' : 'eye-outline'}
                            color="#24c38b"
                          />
                        }
                        value={field.value}
                        onBlur={field.onBlur}
                        onChangeText={field.onChange}
                        secureTextEntry={isPasswordSecure}
                      />
                    )}
                  />
                  {errors.password && (
                    <Text style={styles.errorText}>{errors.password.message}</Text>
                  )}
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                </View>
              </View>
            </KeyboardAvoidingView>
            {loading ? (
              <ActivityIndicator size="large" color="#24c38b" />
            ) : (
              <Button
                style={[
                  styles.loginButton,
                  {
                    backgroundColor: errors ? '#24c38b' : '#dedede',
                  },
                ]}
                onPress={handleSubmit(onLoginPress)}
                color="white"
              >
                {t('login')}
              </Button>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

export default Login;

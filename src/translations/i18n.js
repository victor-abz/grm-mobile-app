import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import 'intl-pluralrules';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import fr from './fr.json';
import rw from './rw.json';

const LANGUAGE_STORAGE_KEY = '@app_language';

export const DEFAULT_LANGUAGE = process.env.EXPO_PUBLIC_DEFAULT_LANGUAGE || 'rw';

const resources = {
  en: { translation: en },
  rw: { translation: rw },
  fr: { translation: fr },
};

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }
    } catch (_e) {
      // ignore read error
    }
    callback(DEFAULT_LANGUAGE);
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (_e) {
      // ignore write error
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

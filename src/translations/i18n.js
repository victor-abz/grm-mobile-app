import { I18n } from "i18n-js";
import en from './fr.json'; //TODO FIX THIS!!!
import fr from './fr.json';
import rw from './rw.json';

// Set the key-value pairs for the different languages you want to support.
export const i18n = new I18n({
  en,
  fr,
  rw,
});
// Set the locale once at the beginning of your app.
i18n.defaultLocale = 'fr';
i18n.locale = 'fr';

// Set the locale once at the beginning of your app.
// When a value is missing from a language it'll fallback to another language with the key present.
i18n.fallbacks = true;


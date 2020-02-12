import React from 'react';
import { connect } from 'react-redux';
import { IntlProvider } from 'react-intl';

import ar from '../locales/ar.json';
import lt from '../locales/lt.json';
import ja from '../locales/ja.json';
import pt from '../locales/pt.json';
import en from '../locales/en.json';
import si from '../locales/si.json';
import uk from '../locales/uk.json';
import ta from '../locales/ta.json';
import nl_NL from '../locales/nl_NL.json';
import pt_BR from '../locales/pt_BR.json';
import id from '../locales/id.json';
import gl from '../locales/gl.json';
import mg from '../locales/mg.json';
import zh_TW from '../locales/zh_TW.json';
import es from '../locales/es.json';
import cs from '../locales/cs.json';
import pl from '../locales/pl.json';
import nb from '../locales/nb.json';
import fa_IR from '../locales/fa_IR.json';
import vi from '../locales/vi.json';
import fr from '../locales/fr.json';
import de from '../locales/de.json';
import it from '../locales/it.json';
import ru from '../locales/ru.json';
import sl from '../locales/sl.json';
import tl from '../locales/tl.json';
import tr from '../locales/tr.json';
import da from '../locales/da.json';
import hu from '../locales/hu.json';
import sw from '../locales/sw.json';
import fi from '../locales/fi.json';
import { setLocale } from '../store/actions/userPreferences';
import * as config from '../config';

const translatedMessages = {
  ar: ar,
  lt: lt,
  ja: ja,
  pt: pt,
  en: en,
  si: si,
  sw: sw,
  uk: uk,
  ta: ta,
  nl_NL: nl_NL,
  pt_BR: pt_BR,
  id: id,
  gl: gl,
  mg: mg,
  zh_TW: zh_TW,
  es: es,
  cs: cs,
  pl: pl,
  nb: nb,
  fa_IR: fa_IR,
  vi: vi,
  fr: fr,
  tr: tr,
  tl: tl,
  de: de,
  it: it,
  ru: ru,
  sl: sl,
  da: da,
  hu: hu,
  fi: fi,
};

// commented out the languages that we are not supporting on the first production release of TM4
const supportedLocales = [
  // { value: 'ar', label: 'Arabic' },
  // { value: 'cs', label: 'Česky' },
  // { value: 'da', label: 'Dansk' },
  // { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  // { value: 'fa_IR', label: 'Persian' },
  // { value: 'fi', label: 'Suomi' },
  { value: 'fr', label: 'Français' },
  // { value: 'hu', label: 'Magyar' },
  // { value: 'gl', label: 'Galician' },
  { value: 'id', label: 'Indonesia' },
  // { value: 'it', label: 'Italiano' },
  // { value: 'ja', label: '日本語' },
  // { value: 'ko', label: '한국어' },
  // { value: 'lt', label: 'Lietuvos' },
  // { value: 'mg', label: 'Malagasy' },
  // { value: 'nb', label: 'Bokmål' },
  // { value: 'nl_NL', label: 'Nederlands' },
  // { value: 'pl', label: 'Polish' },
  { value: 'pt', label: 'Português' },
  { value: 'pt_BR', label: 'Português (Brasil)' },
  // { value: 'ru', label: 'Русский' },
  // { value: 'si', label: 'සිංහල' },
  // { value: 'sl', label: 'Slovenščina' },
  { value: 'sw', label: 'Kiswahili' },
  { value: 'tl', label: 'Filipino' },
  { value: 'tr', label: 'Türkçe' },
  // { value: 'ta', label: 'தமிழ்' },
  // { value: 'uk', label: 'Українська' },
  // { value: 'vi', label: 'tiếng Việt' },
  // { value: 'zh_TW', label: '中文' },
];

function getSupportedLocale(locale) {
  if (locale) {
    let filtered = supportedLocales.filter(i => i.value === locale);
    if (filtered.length) {
      return filtered[0];
    }
    // if we don't have the specific language variation, return the generic locale
    filtered = supportedLocales.filter(i => i.value === locale.substr(0, 2));
    if (filtered.length) {
      return filtered[0];
    }
  }
  return {};
}

function getTranslatedMessages(locale) {
  let localeCode = getSupportedLocale(locale);
  if (localeCode.hasOwnProperty('value')) {
    return translatedMessages[localeCode.value];
  }
  return translatedMessages[locale] || translatedMessages[config.DEFAULT_LOCALE];
}

/* textComponent is for orderBy <select>, see codesandbox at https://github.com/facebook/react/issues/15513 */
let ConnectedIntl = props => (
  <IntlProvider
    key={props.locale}
    locale={props.locale.substr(0, 2)}
    textComponent={React.Fragment}
    messages={getTranslatedMessages(props.locale)}
  >
    {props.children}
  </IntlProvider>
);

const mapStateToProps = state => ({
  locale: state.preferences.locale || navigator.language,
});

ConnectedIntl = connect(
  mapStateToProps,
  { setLocale },
)(ConnectedIntl);

export { ConnectedIntl, supportedLocales, getSupportedLocale, getTranslatedMessages };

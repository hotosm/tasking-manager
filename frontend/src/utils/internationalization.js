import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { IntlProvider } from 'react-intl';
import { polyfill } from './polyfill';

import ar from '../locales/ar.json';
import cs from '../locales/cs.json';
import de from '../locales/de.json';
import el from '../locales/el.json';
import en from '../locales/en.json';
import es from '../locales/es.json';
import fa_IR from '../locales/fa_IR.json';
import fr from '../locales/fr.json';
import he from '../locales/he.json';
import hu from '../locales/hu.json';
import id from '../locales/id.json';
import it from '../locales/it.json';
import ja from '../locales/ja.json';
import ko from '../locales/ko.json';
import mg from '../locales/mg.json';
import ml from '../locales/ml.json';
import nl_NL from '../locales/nl_NL.json';
import pt from '../locales/pt.json';
import pt_BR from '../locales/pt_BR.json';
import ru from '../locales/ru.json';
import sv from '../locales/sv.json';
import sw from '../locales/sw.json';
import tl from '../locales/tl.json';
import tr from '../locales/tr.json';
import uk from '../locales/uk.json';
import zh_TW from '../locales/zh_TW.json';

import { setLocale } from '../store/actions/userPreferences';
import * as config from '../config';

const translatedMessages = {
  ar: ar,
  cs: cs,
  de: de,
  el: el,
  en: en,
  es: es,
  'fa-IR': fa_IR,
  fr: fr,
  he: he,
  hu: hu,
  id: id,
  it: it,
  ja: ja,
  ko: ko,
  mg: mg,
  ml: ml,
  nl: nl_NL,
  pt: pt,
  'pt-BR': pt_BR,
  ru: ru,
  sv: sv,
  sw: sw,
  tl: tl,
  tr: tr,
  uk: uk,
  zh: zh_TW,
};

// commented values doesn't have a good amount of strings translated
const supportedLocales = [
  // { value: 'ar', label: 'عربى' },
  { value: 'cs', label: 'Čeština' },
  { value: 'de', label: 'Deutsch' },
  { value: 'el', label: 'Ελληνικά' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fa-IR', label: 'فارسی' },
  { value: 'fr', label: 'Français' },
  { value: 'he', label: 'עברית' },
  { value: 'hu', label: 'Magyar' },
  { value: 'id', label: 'Indonesia' },
  { value: 'it', label: 'Italiano' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  // { value: 'mg', label: 'Malagasy' },
  // { value: 'ml', label: 'Malayalam' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'pt', label: 'Português' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
  // { value: 'ru', label: 'Русский язык' },
  { value: 'sv', label: 'Svenska' },
  { value: 'sw', label: 'Kiswahili' },
  // { value: 'tl', label: 'Filipino (Tagalog)' },
  { value: 'tr', label: 'Türkçe' },
  { value: 'uk', label: 'Українська' },
  { value: 'zh', label: '繁體中文' },
];

function getSupportedLocale(locale) {
  if (locale) {
    let filtered = supportedLocales.filter((i) => i.value === locale);
    if (filtered.length) {
      return filtered[0];
    }
    // if we don't have the specific language variation, return the generic locale
    filtered = supportedLocales.filter((i) => i.value === locale.substr(0, 2));
    if (filtered.length) {
      return filtered[0];
    }
  }
  return { value: 'en', label: 'English' };
}

function getTranslatedMessages(locale) {
  let localeCode = getSupportedLocale(locale);
  if (localeCode.hasOwnProperty('value')) {
    return translatedMessages[localeCode.value];
  }
  return translatedMessages[locale];
}

/* textComponent is for orderBy <select>, see codesandbox at https://github.com/facebook/react/issues/15513 */
let ConnectedIntl = (props) => {
  useEffect(() => {
    if (props.locale === null) {
      props.setLocale(getSupportedLocale(navigator.language).value);
    }
  }, [props]);

  polyfill(props.locale ? props.locale.substr(0, 2) : config.DEFAULT_LOCALE);

  return (
    <IntlProvider
      key={props.locale || config.DEFAULT_LOCALE}
      locale={props.locale ? props.locale.substr(0, 2) : config.DEFAULT_LOCALE}
      textComponent={React.Fragment}
      messages={getTranslatedMessages(props.locale)}
      timeZone={Intl.DateTimeFormat().resolvedOptions().timeZone}
      // timeZone="America/Chicago"
    >
      {props.children}
    </IntlProvider>
  );
};

const mapStateToProps = (state) => ({
  locale: state.preferences.locale,
});

ConnectedIntl = connect(mapStateToProps, { setLocale })(ConnectedIntl);

export { ConnectedIntl, supportedLocales, getSupportedLocale, getTranslatedMessages };

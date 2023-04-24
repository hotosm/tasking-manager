import { Fragment, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { IntlProvider } from 'react-intl';
import { polyfill } from './polyfill';

import { setLocale } from '../store/actions/userPreferences';
import { DEFAULT_LOCALE } from '../config';

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

async function getTranslatedMessages(locale) {
  let localeCode = getSupportedLocale(locale);
  let val = localeCode;
  if (localeCode.hasOwnProperty('value')) {
    val = localeCode.value;
  }
  if (val) {
    const parsed = val.replace('-', '_');
    return await import(/* webpackChunkName: "lang-[request]" */ `../locales/${parsed}.json`);
  }
  return await import(/* webpackChunkName: "lang-en" */ '../locales/en.json');
}

/* textComponent is for orderBy <select>, see codesandbox at https://github.com/facebook/react/issues/15513 */
let ConnectedIntl = (props) => {
  const [i18nMessages, setI18nMessages] = useState(null);

  useEffect(() => {
    if (props.locale === null) {
      props.setLocale(getSupportedLocale(navigator.language).value);
    }
    getTranslatedMessages(props.locale).then((messages) => setI18nMessages(messages));
  }, [props]);

  polyfill(props.locale ? props.locale.substring(0, 3) : DEFAULT_LOCALE);

  if (i18nMessages === undefined || i18nMessages === null) {
    return <div />;
  }
  return (
    <IntlProvider
      key={props.locale || DEFAULT_LOCALE}
      locale={props.locale ? props.locale.substring(0, 2) : DEFAULT_LOCALE}
      textComponent={Fragment}
      messages={i18nMessages}
      timeZone={Intl.DateTimeFormat().resolvedOptions().timeZone}
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

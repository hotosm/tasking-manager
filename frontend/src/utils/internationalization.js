import React from 'react';
import { connect } from 'react-redux';
import { IntlProvider } from 'react-intl';

import en from '../locales/en.json';
import pt from '../locales/pt.json';
import { setLocale } from '../store/actions/userPreferences';
import * as config from '../config';

const translatedMessages = {
  en: en,
  pt: pt,
};

const supportedLocales = [{ label: 'English', value: 'en' }, { label: 'Português', value: 'pt' }];

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
    locale={props.locale}
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

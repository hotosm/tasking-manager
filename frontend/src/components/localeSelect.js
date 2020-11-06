import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { Dropdown } from './dropdown';
import { supportedLocales } from '../utils/internationalization';
import { setLocale } from '../store/actions/userPreferences';

function LocaleSelect({ userPreferences, setLocale, className }) {
  const onLocaleSelect = (arr) => {
    setLocale(arr[0].value);
  };
  const getActiveLanguageNames = () => {
    const locales = [userPreferences.locale, navigator.language, navigator.language.substr(0, 2)];
    let supportedLocaleNames = [];
    locales.forEach((locale) =>
      supportedLocales
        .filter((i) => i.value === locale)
        .forEach((i) => supportedLocaleNames.push(i)),
    );
    return supportedLocaleNames.length ? supportedLocaleNames[0].value : 'en';
  };
  return (
    <Dropdown
      onAdd={() => {}}
      onRemove={() => {}}
      onChange={onLocaleSelect}
      value={getActiveLanguageNames()}
      options={supportedLocales}
      display={<FormattedMessage {...messages.language} />}
      className={`blue-dark bg-white mr1 v-mid pv2 ph3 ${className}`}
    />
  );
}

const mapStateToProps = (state) => ({
  userPreferences: state.preferences,
});

const LocaleSelector = connect(mapStateToProps, { setLocale })(LocaleSelect);

export { LocaleSelector };

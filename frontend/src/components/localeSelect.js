import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { Dropdown } from './dropdown';
import { supportedLocales } from '../utils/internationalization';
import { setLocale } from '../store/actions/userPreferences';

function LocaleSelect(props) {
  const onLocaleSelect = arr => {
    if (arr.length === 1) {
      props.setLocale(arr[0].value);
    } else if (arr.length > 1) {
      throw new Error('filter select array is big');
    }
  };
  const getActiveLanguageNames = () => {
    const locales = [
      props.userPreferences.locale,
      navigator.language,
      navigator.language.substr(0, 2),
    ];
    let supportedLocaleNames = [];
    locales.forEach(locale =>
      supportedLocales
        .filter(i => i.value === locale)
        .forEach(i => supportedLocaleNames.push(i.label)),
    );
    return supportedLocaleNames[0] || 'English';
  };
  return (
    <Dropdown
      onAdd={() => {}}
      onRemove={() => {}}
      onChange={onLocaleSelect}
      value={getActiveLanguageNames()}
      options={supportedLocales}
      display={<FormattedMessage {...messages.language} />}
      className={`blue-dark bg-white mr1 v-mid dn dib-66rem pv2 ph3 ${props.className}`}
    />
  );
}

const mapStateToProps = state => ({
  userPreferences: state.preferences,
  userDetails: state.auth.get('userDetails'),
  token: state.auth.get('token'),
});

const LocaleSelector = connect(
  mapStateToProps,
  { setLocale },
)(LocaleSelect);

export { LocaleSelector };

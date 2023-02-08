import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import Select from 'react-select';

import messages from './messages';
import { supportedLocales } from '../utils/internationalization';
import { setLocale } from '../store/actions/userPreferences';

function LocaleSelect({
  className,
  userPreferences,
  setLocale,
  removeBorder = true,
  fullWidth = false,
}) {
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
    <div className={`settings-width ml-auto ${className || ''}`}>
      <Select
        classNamePrefix="react-select"
        styles={{
          control: (baseStyles, state) => ({
            ...baseStyles,
            border: removeBorder ? 'none' : 'auto',
            width: fullWidth ? '100%' : `${8 * state.getValue()[0].label.length + 60}px`,
            marginLeft: 'auto',
          }),
          menu: (baseStyles) => ({
            ...baseStyles,
            zIndex: 6,
          }),
        }}
        getOptionLabel={({ label }) => label}
        onChange={(e) => onLocaleSelect([e])}
        options={supportedLocales}
        placeholder={<FormattedMessage {...messages.language} />}
        value={supportedLocales.find((editor) => editor.value === getActiveLanguageNames())}
      />
    </div>
  );
}

const mapStateToProps = (state) => ({
  userPreferences: state.preferences,
});

const LocaleSelector = connect(mapStateToProps, { setLocale })(LocaleSelect);

export { LocaleSelector };

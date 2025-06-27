import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import Select from 'react-select';

import messages from './messages';
import { useFetch } from '../hooks/UseFetch';
import { setLocale } from '../store/actions/userPreferences';

function LocaleSelect({
  className,
  userPreferences,
  setLocale,
  removeBorder = true,
  fullWidth = false,
}) {
  const [errorLanguages, loadingLanguages, languages] = useFetch('system/languages/');

  const supportedLanguages =
    !errorLanguages && !loadingLanguages ? languages.supportedLanguages : [];

  const onLocaleSelect = (arr) => {
    setLocale(arr[0].code);
  };

  const getActiveLanguageNames = () => {
    const locales = [userPreferences.locale, navigator.language, navigator.language.substr(0, 2)];
    let supportedLocaleNames = [];
    locales.forEach((locale) =>
      supportedLanguages
        .filter((i) => i.code === locale)
        .forEach((i) => supportedLocaleNames.push(i)),
    );

    return supportedLocaleNames.length ? supportedLocaleNames[0].code : 'en';
  };

  // wait till supportedLanguages are fetched
  if (!supportedLanguages.length) return <></>;

  return (
    <div className={`settings-width ml-auto ${className || ''}`}>
      <Select
        classNamePrefix="react-select"
        styles={{
          control: (baseStyles, state) => ({
            ...baseStyles,
            border: removeBorder ? 'none' : 'auto',
            width:
              fullWidth || !supportedLanguages.length
                ? '100%'
                : `${8 * state.getValue()[0].language.length + 60}px`,
            marginLeft: 'auto',
          }),
          menu: (baseStyles) => ({
            ...baseStyles,
            zIndex: 6,
          }),
        }}
        getOptionLabel={({ language }) => language}
        onChange={(e) => onLocaleSelect([e])}
        options={supportedLanguages}
        placeholder={<FormattedMessage {...messages.language} />}
        value={supportedLanguages.find((editor) => editor.code === getActiveLanguageNames())}
      />
    </div>
  );
}

const mapStateToProps = (state) => ({
  userPreferences: state.preferences,
});

const LocaleSelector = connect(mapStateToProps, { setLocale })(LocaleSelect);

export { LocaleSelector };

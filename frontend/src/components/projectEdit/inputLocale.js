import React, { useState, useEffect, useLayoutEffect, useCallback, useContext } from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { StateContext, styleClasses } from '../../views/projectEdit';
import { LocaleOption } from './localeOption';
import { CommentInputField } from '../comments/commentInput';

export const InputLocale = ({ children, name, type, maxLength, languages }) => {
  const { projectInfo, setProjectInfo, setSuccess, setError } = useContext(StateContext);
  const [activeLocale, setActiveLocale] = useState(null);
  const locales = projectInfo.projectInfoLocales;
  const translatedLocales = locales
    .filter((l) => l.locale !== projectInfo.defaultLocale)
    .filter((l) => l[name])
    .map((l) => l.locale);

  const getDefaultLocaleLabel = useCallback(() => {
    const filteredLanguages = languages.filter((l) => l.code === projectInfo.defaultLocale);
    if (filteredLanguages.length) return filteredLanguages[0].language;
  }, [languages, projectInfo.defaultLocale]);

  const updateState = (name, value, language) => {
    let selected = locales.filter((f) => f.locale === language);
    let data = null;
    if (selected.length === 0) {
      data = { locale: language, [name]: value };
    } else {
      data = selected[0];
      data[name] = value;
    }
    // create element with new locale.
    let newLocales = locales.filter((f) => f.locale !== language);
    newLocales.push(data);
    setProjectInfo({ ...projectInfo, projectInfoLocales: newLocales });
  };

  // start the component with one of the available translations active
  useEffect(() => {
    if (activeLocale === null && translatedLocales && translatedLocales.length) {
      setActiveLocale(translatedLocales[0]);
    }
  }, [activeLocale, translatedLocales]);

  // Reset success and error when language changes.
  useLayoutEffect(() => {
    setSuccess(false);
    setError(null);
  }, [activeLocale, setSuccess, setError]);

  return (
    <div>
      {children}
      <div className="cf db mb0 pt1">
        <label className="cf db w-100 mb1 blue-grey fw5">
          <FormattedMessage {...messages.language} /> - {getDefaultLocaleLabel()}
        </label>
        <LocalizedInputField
          type={type}
          name={name}
          maxLength={maxLength}
          updateContext={updateState}
          locale={projectInfo.defaultLocale}
        />
      </div>
      <p className="cf db w-100 mv0 blue-grey fw5">
        <FormattedMessage {...messages.translations} />
      </p>
      <ul className="list mb2 mt2 pa0 w-100 flex flex-wrap ttu">
        {languages &&
          languages
            .filter((l) => l.code !== projectInfo.defaultLocale)
            .map((l) => (
              <LocaleOption
                key={l.code}
                localeCode={l.code}
                name={l.language}
                isActive={l.code === activeLocale}
                hasValue={translatedLocales.includes(l.code)}
                onClick={setActiveLocale}
              />
            ))}
      </ul>
      {activeLocale ? (
        <LocalizedInputField
          type={type}
          name={name}
          maxLength={maxLength}
          updateContext={updateState}
          locale={activeLocale}
        />
      ) : (
        <span className="pt2">
          <FormattedMessage {...messages.selectLanguage} />
        </span>
      )}
    </div>
  );
};

const LocalizedInputField = ({ type, maxLength, name, locale, updateContext }) => {
  const { projectInfo, success, setSuccess, error, setError } = useContext(StateContext);
  const [value, setValue] = useState('');

  const updateValue = useCallback(() => {
    const activeLocale = projectInfo.projectInfoLocales.filter((item) => item.locale === locale);
    if (activeLocale.length && activeLocale[0][name]) {
      setValue(activeLocale[0][name]);
    } else {
      setValue('');
    }
  }, [locale, name, projectInfo.projectInfoLocales]);

  // clean or set a new field value when the locale changes
  useEffect(() => updateValue(), [locale, updateValue]);

  const handleChange = (e) => {
    setValue(e.target.value);
    clearInfoState();
  };

  const handleMarkdownEditorChange = (value) => {
    setValue(value);
    clearInfoState();
  };

  const clearInfoState = () => {
    if (success !== false) setSuccess(false);
    if (error !== null) setError(null);
  };

  return (
    <>
      {type === 'text' ? (
        <input
          type="text"
          onBlur={() => updateContext(name, value, locale)}
          className={styleClasses.inputClass}
          name={name}
          value={value}
          onChange={handleChange}
        />
      ) : (
        <div className="w-80">
          <CommentInputField
            isShowTabNavs
            isShowFooter
            comment={value}
            setComment={handleMarkdownEditorChange}
            maxLength={maxLength}
            markdownTextareaProps={{
              onBlur: () => updateContext(name, value, locale),
              maxLength: maxLength || null,
              name: name,
            }}
            placeholderMsg={messages.typeHere}
          />
        </div>
      )}
      {maxLength && (
        <div
          className={`tr w-80 f7 ${value && value.length > 0.9 * maxLength ? 'red' : 'blue-light'}`}
        >
          {value ? value.length : 0} / {maxLength}
        </div>
      )}
    </>
  );
};

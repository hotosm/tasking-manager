import React, { useState, useEffect, useLayoutEffect, useCallback, useContext } from 'react';
import { useDropzone } from 'react-dropzone';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { useOnDrop } from '../../hooks/UseUploadImage';
import { htmlFromMarkdown } from '../../utils/htmlFromMarkdown';
import { StateContext, styleClasses } from '../../views/projectEdit';
import FileRejections from '../comments/fileRejections';
import DropzoneUploadStatus from '../comments/uploadStatus';
import { LocaleOption } from './localeOption';
import { DROPZONE_SETTINGS } from '../../config';

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
  const [value, setValue] = useState(null);
  const [preview, setPreview] = useState(null);
  const appendImgToComment = (url) => setValue(`${value}\n![image](${url})\n`);
  const [uploadError, uploading, onDrop] = useOnDrop(appendImgToComment);
  const { fileRejections, getRootProps, getInputProps } = useDropzone({
    onDrop,
    ...DROPZONE_SETTINGS,
  });

  const updateValue = useCallback(() => {
    const activeLocale = projectInfo.projectInfoLocales.filter((item) => item.locale === locale);
    if (activeLocale.length && activeLocale[0][name]) {
      setValue(activeLocale[0][name]);
    } else {
      setValue('');
      setPreview(false);
    }
  }, [locale, name, projectInfo.projectInfoLocales]);

  // clean or set a new field value when the locale changes
  useEffect(() => updateValue(), [locale, updateValue]);

  // hide preview when saved successfully
  useEffect(() => {
    if (success) setPreview(false);
  }, [success]);

  const handleChange = (e) => {
    setValue(e.target.value);
    if (success !== false) setSuccess(false);
    if (error !== null) setError(null);
    if (!preview) setPreview(true);
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
        <div {...getRootProps()}>
          <textarea
            {...getInputProps()}
            className={styleClasses.inputClass}
            style={{ display: 'inline-block' }} // we need to set display, as dropzone makes it none as default
            rows={styleClasses.numRows}
            type="text"
            name={name}
            value={value}
            onBlur={() => updateContext(name, value, locale)}
            onChange={handleChange}
            maxLength={maxLength || null}
          ></textarea>
          <FileRejections files={fileRejections} />
          <DropzoneUploadStatus uploading={uploading} uploadError={uploadError} />
        </div>
      )}
      {maxLength && (
        <div
          className={`tr cf fl w-80 f7 ${
            value && value.length > 0.9 * maxLength ? 'red' : 'blue-light'
          }`}
        >
          {value ? value.length : 0} / {maxLength}
        </div>
      )}
      {type !== 'text' && preview && (
        <div className="cf mb3">
          <h3 className="ttu f6 fw6 blue-grey mb1">
            <FormattedMessage {...messages.preview} />
          </h3>
          <div
            className="pv1 ph3 bg-grey-light blue-dark markdown-content"
            dangerouslySetInnerHTML={htmlFromMarkdown(value)}
          />
        </div>
      )}
    </>
  );
};

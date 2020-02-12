import React, { useState, useLayoutEffect, useCallback, useContext } from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { htmlFromMarkdown } from '../../utils/htmlFromMarkdown';
import { StateContext, styleClasses } from '../../views/projectEdit';

export const InputLocale = props => {
  const { projectInfo, setProjectInfo } = useContext(StateContext);
  const [language, setLanguage] = useState(null);
  const [value, setValue] = useState('');
  const [preview, setPreview] = useState(null);

  const locales = projectInfo.projectInfoLocales;

  const updateState = e => {
    let selected = locales.filter(f => f.locale === language);
    let data = null;
    if (selected.length === 0) {
      data = { locale: language, [e.target.name]: e.target.value };
    } else {
      data = selected[0];
      data[e.target.name] = e.target.value;
    }
    // create element with new locale.
    let newLocales = locales.filter(f => f.locale !== language);
    newLocales.push(data);
    setProjectInfo({ ...projectInfo, projectInfoLocales: newLocales });
  };

  const handleChange = e => {
    setValue(e.target.value);
    if (props.preview !== false) {
      const html = htmlFromMarkdown(e.target.value);
      setPreview(html);
    }
  };

  // Resets preview when language changes.
  useLayoutEffect(() => {
    setPreview(null);
  }, [language]);

  const getValue = useCallback(() => {
    const data = locales.filter(l => l.locale === language);
    if (data.length > 0) {
      return data[0][props.name];
    } else {
      return '';
    }
  }, [language, locales, props.name]);

  useLayoutEffect(() => {
    if (language === null) {
      if (projectInfo.defaultLocale) {
        setLanguage(projectInfo.defaultLocale);
      }
    }
  }, [projectInfo, language]);

  useLayoutEffect(() => {
    const fieldValue = getValue();
    setValue(fieldValue);
  }, [getValue]);

  return (
    <div>
      <ul className="list mb4 pa0 w-100 flex flex-wrap ttu">
        {props.languages === null
          ? null
          : props.languages.map((l, n) => (
              <li
                key={n}
                onClick={() => setLanguage(l.code)}
                className={
                  (l.code !== language ? 'bg-white blue-dark' : 'bg-blue-dark white') +
                  ' ph2 mb2 pv1 f7 mr2 pointer'
                }
                title={l.language}
              >
                {l.code}
              </li>
            ))}
      </ul>
      {props.children}
      {props.type === 'text' ? (
        <input
          type="text"
          onBlur={updateState}
          className={styleClasses.inputClass}
          name={props.name}
          value={value}
          onChange={handleChange}
        />
      ) : (
        <textarea
          className={styleClasses.inputClass}
          rows={styleClasses.numRows}
          type="text"
          name={props.name}
          value={value}
          onBlur={updateState}
          onChange={handleChange}
          maxLength={props.maxLength || null}
        ></textarea>
      )}
      {props.maxLength && (
        <div
          className={`tr cf fl w-80 f7 ${
            value.length > 0.9 * props.maxLength ? 'red' : 'blue-light'
          }`}
        >
          {value.length} / {props.maxLength}
        </div>
      )}

      {preview && (
        <div className="cf pt1">
          <h3 className="ttu f6 fw6 blue-grey mb1">
            <FormattedMessage {...messages.preview} />
          </h3>
          <div dangerouslySetInnerHTML={preview} className="pv1 ph3 bg-grey-light blue-dark" />
        </div>
      )}
    </div>
  );
};

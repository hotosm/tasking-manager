import React, { useState, useLayoutEffect, useCallback, useContext } from 'react';
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
          : props.languages.map(l => (
              <li
                onClick={() => setLanguage(l.code)}
                className={
                  (l.code !== language ? 'bg-white blue-dark' : 'bg-blue-dark white') +
                  ' ph2 mb2 pv1 f7 mr2 pointer'
                }
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
        ></textarea>
      )}

      {preview ? <div dangerouslySetInnerHTML={preview} /> : null}
    </div>
  );
};

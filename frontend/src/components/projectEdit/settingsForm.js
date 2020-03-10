import React, { useContext } from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { SwitchToggle } from '../formInputs';
import { getEditors } from '../../utils/editorsList';
import { StateContext, styleClasses, handleCheckButton } from '../../views/projectEdit';

export const SettingsForm = ({ languages, defaultLocale }) => {
  const { projectInfo, setProjectInfo } = useContext(StateContext);

  const handleMappingEditors = event => {
    let editors = projectInfo.mappingEditors;
    editors = handleCheckButton(event, editors);
    setProjectInfo({ ...projectInfo, mappingEditors: editors });
  };

  const handleValidationEditors = event => {
    let editors = projectInfo.validationEditors;
    editors = handleCheckButton(event, editors);
    setProjectInfo({ ...projectInfo, validationEditors: editors });
  };

  const updateDefaultLocale = event => {
    setProjectInfo({ ...projectInfo, defaultLocale: event.target.value });
  };

  const editors = getEditors();
  return (
    <div className="w-100">
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.language} />
        </label>
        <select name="defaultLocale" onChange={updateDefaultLocale} className="pa2">
          {languages.map(l => (
            <option selected={l.code === defaultLocale ? true : false} value={l.code}>
              {l.language} ({l.code})
            </option>
          ))}
        </select>
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.mappingEditors} />
        </label>
        {editors.map(elm => (
          <label className="db pv2">
            <input
              className="mr2"
              name="mapping_editors"
              onChange={handleMappingEditors}
              checked={projectInfo.mappingEditors.includes(elm.value)}
              type="checkbox"
              value={elm.value}
            />
            {elm.label}
          </label>
        ))}
        {projectInfo.hasOwnProperty('customEditor') && projectInfo.customEditor && (
          <label className="db pv2">
            <input
              className="mr2"
              name="mapping_editors"
              onChange={handleMappingEditors}
              checked={projectInfo.mappingEditors.includes('CUSTOM')}
              type="checkbox"
              value={'CUSTOM'}
            />
            <FormattedMessage {...messages.customEditor} />
            <span className="">: {projectInfo.customEditor.name}</span>
          </label>
        )}
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.validationEditors} />
        </label>
        {editors.map(elm => (
          <label className="db pv2">
            <input
              className="mr2"
              name="validation_editors"
              onChange={handleValidationEditors}
              checked={projectInfo.validationEditors.includes(elm.value)}
              type="checkbox"
              value={elm.value}
            />
            {elm.label}
          </label>
        ))}
        {projectInfo.hasOwnProperty('customEditor') && projectInfo.customEditor && (
          <label className="db pv2">
            <input
              className="mr2"
              name="validation_editors"
              onChange={handleValidationEditors}
              checked={projectInfo.validationEditors.includes('CUSTOM')}
              type="checkbox"
              value={'CUSTOM'}
            />
            <FormattedMessage {...messages.customEditor} />
            <span className="">: {projectInfo.customEditor.name}</span>
          </label>
        )}
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.randomTaskSelection} />
        </label>
        <SwitchToggle
          label={<FormattedMessage {...messages.randomTaskSelectionMapping} />}
          labelPosition="right"
          isChecked={projectInfo.enforceRandomTaskSelection}
          onChange={() =>
            setProjectInfo({
              ...projectInfo,
              enforceRandomTaskSelection: !projectInfo.enforceRandomTaskSelection,
            })
          }
        />
        <p className={styleClasses.pClass}>
          <FormattedMessage {...messages.randomTaskSelectionDescription} />
        </p>
      </div>
    </div>
  );
};

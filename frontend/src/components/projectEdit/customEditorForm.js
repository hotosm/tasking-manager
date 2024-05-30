import React, { useContext } from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { SwitchToggle } from '../formInputs';
import { StateContext, styleClasses } from '../../views/projectEdit';
import { CustomButton } from '../button';
import { WasteIcon } from '../svgIcons';

const CustomEditorTextInput = ({ name, value, handleChange }) => {
  return (
    <div className={styleClasses.divClass}>
      <label className={styleClasses.labelClass}>
        {name === 'name' ? (
          <FormattedMessage {...messages.customEditorName} />
        ) : (
          <FormattedMessage {...messages.customEditorUrl} />
        )}
      </label>
      <input
        className={styleClasses.inputClass}
        onChange={handleChange}
        name={name}
        type="text"
        value={value}
      />
    </div>
  );
};

export const CustomEditorForm = ({ languages }) => {
  const { projectInfo, setProjectInfo } = useContext(StateContext);

  const handleChange = (event) => {
    var value = (val) =>
      event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    var customEditor = { ...projectInfo.customEditor, [event.target.name]: value() };
    setProjectInfo({ ...projectInfo, customEditor: customEditor });
  };

  const handleMappingEditors = () => {
    let editors = projectInfo.mappingEditors;
    if (editors.includes('CUSTOM')) {
      editors = editors.filter((item) => item !== 'CUSTOM');
    } else {
      editors.push('CUSTOM');
    }
    setProjectInfo({ ...projectInfo, mappingEditors: editors });
  };

  const handleValidationEditors = () => {
    let editors = projectInfo.validationEditors;
    if (editors.includes('CUSTOM')) {
      editors = editors.filter((item) => item !== 'CUSTOM');
    } else {
      editors.push('CUSTOM');
    }
    setProjectInfo({ ...projectInfo, validationEditors: editors });
  };

  const handleRemove = (event) => {
    setProjectInfo({ ...projectInfo, customEditor: null });
  };

  return (
    <div className="w-100">
      <CustomEditorTextInput
        name="name"
        value={projectInfo.customEditor ? projectInfo.customEditor.name : ''}
        handleChange={handleChange}
      />
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.customEditorDescription} />
        </label>
        <textarea
          className={styleClasses.inputClass}
          onChange={handleChange}
          rows={styleClasses.numRows}
          name="description"
          type="text"
          value={projectInfo.customEditor ? projectInfo.customEditor.description : ''}
        />
      </div>
      <CustomEditorTextInput
        name="url"
        value={projectInfo.customEditor ? projectInfo.customEditor.url : ''}
        handleChange={handleChange}
      />
      {projectInfo.customEditor && (
        <>
          <div className={styleClasses.divClass}>
            <label className="db pb3">
              <SwitchToggle
                label={<FormattedMessage {...messages.customEditorEnabledForMapping} />}
                labelPosition="right"
                isChecked={projectInfo.mappingEditors.includes('CUSTOM')}
                onChange={handleMappingEditors}
              />
            </label>
            <label className="db pt1">
              <SwitchToggle
                label={<FormattedMessage {...messages.customEditorEnabledForValidation} />}
                labelPosition="right"
                isChecked={projectInfo.validationEditors.includes('CUSTOM')}
                onChange={handleValidationEditors}
              />
            </label>
          </div>
          <div className={styleClasses.divClass}>
            <label className={styleClasses.labelClass}>
              <FormattedMessage {...messages.deleteCustomEditor} />
            </label>
            <p className={styleClasses.pClass}>
              <FormattedMessage {...messages.confirmDeleteCustomEditor} />
            </p>
            <CustomButton className="red bg-white pv2 ph3 ba b--red" onClick={handleRemove}>
              <WasteIcon className="pr2 v-top" />
              <FormattedMessage {...messages.removeCustomEditor} />
            </CustomButton>
          </div>
        </>
      )}
    </div>
  );
};

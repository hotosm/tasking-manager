import React, { useContext } from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { StateContext, styleClasses } from '../../views/projectEdit';
import { Button } from '../button';

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
          <FormattedMessage {...messages.customEditorDescription} />*
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
      <div className={styleClasses.divClass}>
        <label className="db pv2">
          <input
            className="mr2"
            name="enabled"
            onChange={handleChange}
            type="checkbox"
            checked={projectInfo.customEditor ? projectInfo.customEditor.enabled : false}
          />
          <FormattedMessage {...messages.customEditorEnabled} />
        </label>
      </div>
      {projectInfo.customEditor && (
        <div className={styleClasses.divClass}>
          <label className={styleClasses.labelClass}>
            <FormattedMessage {...messages.deleteCustomEditor} />
          </label>
          <p className={styleClasses.pClass}>
            <FormattedMessage {...messages.confirmDeleteCustomEditor} />
          </p>
          <Button className={styleClasses.actionClass} onClick={handleRemove}>
            <FormattedMessage {...messages.removeCustomEditor} />
          </Button>
        </div>
      )}
    </div>
  );
};

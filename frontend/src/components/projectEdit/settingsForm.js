import { useContext } from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { SwitchToggle, CheckBox } from '../formInputs';
import { getEditors } from '../../utils/editorsList';
import { StateContext, styleClasses } from '../../views/projectEdit';

export const SettingsForm = ({ languages, defaultLocale }) => {
  const { projectInfo, setProjectInfo } = useContext(StateContext);

  const handleMappingEditors = (editors) => {
    setProjectInfo({ ...projectInfo, mappingEditors: editors });
  };

  const handleValidationEditors = (editors) => {
    setProjectInfo({ ...projectInfo, validationEditors: editors });
  };

  const updateDefaultLocale = (event) => {
    setProjectInfo({ ...projectInfo, defaultLocale: event.target.value });
  };

  const editors = getEditors();
  return (
    <div className="w-100">
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.language} />
        </label>
        <select
          name="defaultLocale"
          onChange={updateDefaultLocale}
          className="pa2 bg-white ba ba--grey-light"
          value={defaultLocale}
        >
          {languages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.language} ({l.code})
            </option>
          ))}
        </select>
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.mappingEditors} />
        </label>
        {editors.map((elm) => (
          <div className="pv3 pr3" aria-label="mapping editor" key={elm.value}>
            <div className="ph0 pt1 fl" aria-labelledby={elm.value}>
              <CheckBox
                activeItems={projectInfo.mappingEditors}
                toggleFn={handleMappingEditors}
                itemId={elm.value}
              />
            </div>
            <span className="fl pt2 mr1 ph2" id={elm.value}>
              {elm.label}
            </span>
          </div>
        ))}
        {projectInfo.hasOwnProperty('customEditor') && projectInfo.customEditor && (
          <div className="pv3 pr3" aria-label="mapping editor">
            <div className="ph0 pt1 fl" aria-labelledby={'Custom'}>
              <CheckBox
                activeItems={projectInfo.mappingEditors}
                toggleFn={handleMappingEditors}
                itemId={'CUSTOM'}
              />
            </div>
            <span className="fl dib pt2 mr1 ph2" id={'Custom'}>
              <FormattedMessage {...messages.customEditor} />
              <span className="">: {projectInfo.customEditor.name}</span>
            </span>
          </div>
        )}
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.validationEditors} />
        </label>
        {editors.map((elm) => (
          <div className="pv3 pr3" aria-label="validation editor" key={elm.value}>
            <div className="ph0 pt1 fl" aria-labelledby={elm.value}>
              <CheckBox
                activeItems={projectInfo.validationEditors}
                toggleFn={handleValidationEditors}
                itemId={elm.value}
              />
            </div>
            <span className="fl pt2 mr1 ph2" id={elm.value}>
              {elm.label}
            </span>
          </div>
        ))}
        {projectInfo.hasOwnProperty('customEditor') && projectInfo.customEditor && (
          <div className="pv3 pr3" aria-label="validation editor">
            <div className="ph0 pt1 fl" aria-labelledby={'Custom'}>
              <CheckBox
                activeItems={projectInfo.validationEditors}
                toggleFn={handleValidationEditors}
                itemId={'CUSTOM'}
              />
            </div>
            <span className="fl dib pt2 mr1 ph2" id={'Custom'}>
              <FormattedMessage {...messages.customEditor} />
              <span className="">: {projectInfo.customEditor.name}</span>
            </span>
          </div>
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
      {(projectInfo.mappingEditors.includes('RAPID') ||
        projectInfo.validationEditors.includes('RAPID')) && (
        <div className={styleClasses.divClass}>
          <label className={styleClasses.labelClass}>
            <FormattedMessage {...messages.rapidPowerUser} />
            <div className={'rapid-beta'} />
          </label>

          <SwitchToggle
            isChecked={projectInfo.rapidPowerUser}
            label={<FormattedMessage {...messages.rapidPowerUser} />}
            labelPosition={'right'}
            onChange={() =>
              setProjectInfo({
                ...projectInfo,
                rapidPowerUser: !projectInfo.rapidPowerUser,
              })
            }
          />
          <p className={styleClasses.pClass}>
            <FormattedMessage {...messages.rapidPowerUserDescription} />
          </p>
        </div>
      )}
    </div>
  );
};

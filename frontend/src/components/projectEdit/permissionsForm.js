import React, { useContext } from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { SwitchToggle } from '../formInputs';
import { StateContext, styleClasses } from '../../views/projectEdit';
import { TeamSelect } from './teamSelect';

export const PermissionsForm = () => {
  const { projectInfo, setProjectInfo } = useContext(StateContext);
  const permissions = [
    { label: <FormattedMessage {...messages.permissions_ANY} />, value: 'ANY' },
    { label: <FormattedMessage {...messages.permissions_LEVEL} />, value: 'LEVEL' },
    { label: <FormattedMessage {...messages.permissions_TEAMS} />, value: 'TEAMS' },
    { label: <FormattedMessage {...messages.permissions_TEAMS_LEVEL} />, value: 'TEAMS_LEVEL' },
  ];

  return (
    <div className="w-100">
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.mappingPermission} />
        </label>
        <p className={styleClasses.pClass}>
          <FormattedMessage {...messages.mappingPermissionDescription} />
        </p>
        {permissions.map((permission) => (
          <label className="db pv2" key={permission}>
            <input
              value={permission.value}
              checked={projectInfo.mappingPermission === permission.value}
              onChange={() =>
                setProjectInfo({
                  ...projectInfo,
                  mappingPermission: permission.value,
                })
              }
              type="radio"
              className={`radio-input input-reset pointer v-mid dib h2 w2 mr2 br-100 ba b--blue-light`}
            />
            {permission.label}
          </label>
        ))}
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.validationPermission} />
        </label>
        <p className={styleClasses.pClass}>
          <FormattedMessage {...messages.validationPermissionDescription} />
        </p>
        {permissions.map((permission) => (
          <label className="db pv2" key={permission}>
            <input
              value={permission.value}
              checked={projectInfo.validationPermission === permission.value}
              onChange={() =>
                setProjectInfo({
                  ...projectInfo,
                  validationPermission: permission.value,
                })
              }
              type="radio"
              className={`radio-input input-reset pointer v-mid dib h2 w2 mr2 br-100 ba b--blue-light`}
            />
            {permission.label}
          </label>
        ))}
      </div>
      <div className={styleClasses.divClass.replace('w-70', 'w-90')}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.teams} />
        </label>
        <TeamSelect />
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.privacy} />
        </label>
        <p className={styleClasses.pClass}>
          <FormattedMessage {...messages.privacyDescription} />
        </p>
        <SwitchToggle
          label={<FormattedMessage {...messages.privateProject} />}
          labelPosition="right"
          isChecked={projectInfo.private}
          onChange={() => setProjectInfo({ ...projectInfo, private: !projectInfo.private })}
        />
      </div>
    </div>
  );
};

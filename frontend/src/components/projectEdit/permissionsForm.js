import React, { useContext } from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { SwitchToggle } from '../formInputs';
import { StateContext, styleClasses } from '../../views/projectEdit';
import { TeamSelect } from './teamSelect';
import { PermissionsBlock } from './permissionsBlock';

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
      <PermissionsBlock permissions={permissions} type="mappingPermission" />
      <PermissionsBlock permissions={permissions} type="validationPermission" />
      <div className={styleClasses.divClass.replace('w-70', 'w-90')}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.teams} />
        </label>
        <TeamSelect />
        <p className="f6 blue-grey w-80 mt2">
          <FormattedMessage {...messages.teamsPermissionNote} />
        </p>
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

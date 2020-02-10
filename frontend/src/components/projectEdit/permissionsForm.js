import React, { useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { SwitchToggle } from '../formInputs';
import { StateContext, styleClasses } from '../../views/projectEdit';
import { TeamSelect } from './teamSelect';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';

export const PermissionsForm = () => {
  const { projectInfo, setProjectInfo } = useContext(StateContext);
  const userDetails = useSelector(state => state.auth.get('userDetails'));
  const [organisations, setOrganisations] = useState([]);
  useEffect(() => {
    if (userDetails && userDetails.id) {
      const query = userDetails.role === 'ADMIN' ? '' : `?manager_user_id=${userDetails.id}`;
      fetchLocalJSONAPI(`organisations/${query}`)
        .then(result => setOrganisations(result.organisations))
        .catch(e => console.log(e));
    }
  }, [userDetails]);

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
        {permissions.map(permission => (
          <label className="db pv2" key={permission}>
            <input
              value={permission.value}
              checked={projectInfo.mapping_permission === permission.value}
              onChange={() =>
                setProjectInfo({
                  ...projectInfo,
                  mapping_permission: permission.value,
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
        {permissions.map(permission => (
          <label className="db pv2" key={permission}>
            <input
              value={permission.value}
              checked={projectInfo.validation_permission === permission.value}
              onChange={() =>
                setProjectInfo({
                  ...projectInfo,
                  validation_permission: permission.value,
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
          <FormattedMessage {...messages.organisation} />
        </label>
        <p className={styleClasses.pClass}>
          <FormattedMessage {...messages.organisationDescription} />
        </p>
        <Select
          isClearable={false}
          getOptionLabel={option => option.name}
          getOptionValue={option => option.organisationId}
          options={organisations}
          defaultValue={
            projectInfo.organisation && {
              name: projectInfo.organisationName,
              value: projectInfo.organisation,
            }
          }
          placeholder={<FormattedMessage {...messages.selectOrganisation} />}
          onChange={value =>
            setProjectInfo({ ...projectInfo, organisation: value.organisationId || '' })
          }
          className="z-5"
        />
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
          label={'Private project'}
          labelPosition="right"
          isChecked={projectInfo.private}
          onChange={() => setProjectInfo({ ...projectInfo, private: !projectInfo.private })}
        />
      </div>
    </div>
  );
};

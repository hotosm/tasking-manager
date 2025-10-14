import { useContext, useEffect, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import Select from 'react-select';

import messages from './messages.js';
import { StateContext, styleClasses } from '../../views/projectEdit';
import { useTeamsQuery } from '../../api/teams';
import { DEFAULT_VALIDATOR_TEAM_ID } from '../../config';

const defaultValidatorPermissions = ['TEAMS'];
const defaultValidatorTeamId = Number(DEFAULT_VALIDATOR_TEAM_ID);

export const PermissionsBlock = ({ permissions, levels, type }: Object) => {
  const { projectInfo, setProjectInfo } = useContext(StateContext);
  const { data: teamsData } = useTeamsQuery({ omitMemberList: true });
  const isDefaultValidatorAlreadyPresent = useRef(false);

  // check if default validator already present on teams
  useEffect(() => {
    isDefaultValidatorAlreadyPresent.current = projectInfo.teams.some(
      (team) => team.teamId === defaultValidatorTeamId,
    );
  }, []); // eslint-disable-line -- run only on first render

  const handlePermissionChange = (value) => {
    let teams = projectInfo.teams;
    // validation permission case
    if (type === 'validationPermission') {
      const isDefaultValidatorCase = defaultValidatorPermissions.includes(value);
      // add default validators by default case
      if (isDefaultValidatorCase) {
        const defaultValidatorTeam = teamsData?.teams?.find(
          (team) => team.teamId === defaultValidatorTeamId,
        );
        if (
          defaultValidatorTeam &&
          // check if default validator already present
          !projectInfo.teams.some((team) => team.teamId === defaultValidatorTeamId)
        ) {
          const defaultValidatorTeamData = {
            teamId: defaultValidatorTeam.teamId,
            name: defaultValidatorTeam.name,
            role: 'VALIDATOR',
          };
          // add default validator to teams
          teams = [defaultValidatorTeamData, ...projectInfo.teams];
        }
        // remove default validator from team if not default validator case
      } else if (!isDefaultValidatorAlreadyPresent.current) {
        teams = projectInfo.teams.filter((team) => team.teamId !== defaultValidatorTeamId);
      }
    }

    setProjectInfo({
      ...projectInfo,
      [type]: value,
      teams,
    });
  };

  const levelOptions = levels.map((l) => ({value: l.id, label: l.name}));
  const levelValue = levelOptions.find((l) => {
    if (type === 'mappingPermission') {
      return l.value === projectInfo.mappingPermissionLevelId;
    } else {
      return l.value === projectInfo.validationPermissionLevelId;
    }
  });

  const handlePermissionLevelChange = ({ value }) => {
    setProjectInfo({
      ...projectInfo,
      [`${type}LevelId`]: value,
    });
  };

  return (
    <div className={styleClasses.divClass}>
      <label className={styleClasses.labelClass}>
        {type === 'mappingPermission' ? (
          <FormattedMessage {...messages.mappingPermission} />
        ) : (
          <FormattedMessage {...messages.validationPermission} />
        )}
      </label>

      <p className={styleClasses.pClass}>
        {type === 'mappingPermission' ? (
          <FormattedMessage {...messages.mappingPermissionDescription} />
        ) : (
          <FormattedMessage {...messages.validationPermissionDescription} />
        )}
      </p>

      {permissions.map((permission) => (
        <label className="db pv2" key={permission.label.props.id}>
          <input
            value={permission.value}
            checked={projectInfo[type] === permission.value}
            onChange={() => handlePermissionChange(permission.value)}
            type="radio"
            className={`radio-input input-reset pointer v-mid dib h2 w2 mr2 br-100 ba b--blue-light`}
          />
          {permission.label}
        </label>
      ))}

      <p className={styleClasses.pClass}>
        {type === 'mappingPermission' ? (
          <FormattedMessage {...messages.mappingPermissionLevelDescription} />
        ) : (
          <FormattedMessage {...messages.validationPermissionLevelDescription} />
        )}
      </p>

      <Select
        options={levelOptions}
        value={levelValue}
        onChange={handlePermissionLevelChange}
        className="z-5"
      />
    </div>
  );
};

import { useContext, useEffect, useRef } from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages.js';
import { StateContext, styleClasses } from '../../views/projectEdit';
import { useTeamsQuery } from '../../api/teams';

const globalValidatorPermissions = ['TEAMS', 'TEAMS_LEVEL'];
const hotGlobalValidatorTeamName = 'HOT Global Validators';

export const PermissionsBlock = ({ permissions, type }: Object) => {
  const { projectInfo, setProjectInfo } = useContext(StateContext);
  const { data: teamsData } = useTeamsQuery({ omitMemberList: true });
  const isGlobalValidatorAlreadyPresent = useRef(false);

  // check if global validator already present on teams
  useEffect(() => {
    isGlobalValidatorAlreadyPresent.current = projectInfo.teams.some(
      (team) => team.name === hotGlobalValidatorTeamName,
    );
  }, []); // eslint-disable-line -- run only on first render

  const handlePermissionChange = (value) => {
    let teams = projectInfo.teams;
    // validation permission case
    if (type === 'validationPermission') {
      const isGlobalValidatorCase = globalValidatorPermissions.includes(value);
      // add `HOT Global Validators` by default case
      if (isGlobalValidatorCase) {
        const globalValidatorTeam = teamsData?.teams?.find(
          (team) => team.name === hotGlobalValidatorTeamName,
        );
        if (
          globalValidatorTeam &&
          // check if hotGlobalValidator already present
          !projectInfo.teams.some((team) => team.name === hotGlobalValidatorTeamName)
        ) {
          const hotGlobalValidatorTeam = {
            teamId: globalValidatorTeam.teamId,
            name: globalValidatorTeam.name,
            role: 'VALIDATOR',
          };
          // add hotGlobalValidator to teams
          teams = [hotGlobalValidatorTeam, ...projectInfo.teams];
        }
        // remove hotGlobalValidator from team if not HOT Global Validator case
      } else if (!isGlobalValidatorAlreadyPresent.current) {
        teams = projectInfo.teams.filter((team) => team.name !== hotGlobalValidatorTeamName);
      }
    }
    // set project info
    setProjectInfo({
      ...projectInfo,
      [type]: value,
      teams,
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
    </div>
  );
};

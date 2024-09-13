import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { getPermissionErrorMessage } from '../../utils/projectPermissions';
import { Button } from '../button';
import { CloseIcon } from '../svgIcons';
import { TeamBox } from '../teamsAndOrgs/teams';

export function UserPermissionErrorContent({ project, userLevel, close }: Object) {
  const navigate = useNavigate();
  const [userPermissionError, setUserPermissionEror] = useState(null);
  useEffect(() => {
    setUserPermissionEror(getPermissionErrorMessage(project, userLevel));
  }, [userLevel, project, setUserPermissionEror]);

  return (
    <div className="pa2 tc">
      <span className="fr relative blue-light pt1 link pointer" onClick={() => close()}>
        <CloseIcon style={{ height: '18px', width: '18px' }} />
      </span>
      <h3 className="f3 fw6 barlow-condensed">
        <FormattedMessage {...messages.permissionErrorTitle} />
      </h3>
      <p>
        {userPermissionError && (
          <FormattedMessage {...messages[`permissionError_${userPermissionError}`]} />
        )}
      </p>
      {userPermissionError === 'userIsNotMappingTeamMember' && (
        <div className="pb3">
          {project.teams
            .filter((team) => team.role === 'MAPPER')
            .map((team) => (
              <TeamBox key={team.teamId} team={team} className="dib pv2 ph3 mt2 ba f6 tc" />
            ))}
        </div>
      )}
      {userPermissionError === 'userIsNotValidationTeamMember' && (
        <div className="pb3">
          {project.teams
            .filter((team) => team.role === 'VALIDATOR')
            .map((team) => (
              <TeamBox key={team.teamId} team={team} className="dib pv2 ph3 mt2 ba f6 tc" />
            ))}
        </div>
      )}
      <div className="pa2">
        <Button className="white bg-red" onClick={() => navigate('/explore')}>
          <FormattedMessage {...messages.selectAnotherProject} />
        </Button>
      </div>
    </div>
  );
}

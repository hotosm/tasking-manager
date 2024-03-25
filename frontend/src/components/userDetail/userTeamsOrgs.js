import { FormattedMessage } from 'react-intl';

import { TeamBox } from '../teamsAndOrgs/teams';
import { useUserOrganisationsQuery } from '../../api/organisations';
import { useTeamsQuery } from '../../api/teams';
import { Alert } from '../alert';
import messages from './messages';

export const UserTeams = ({ userId }) => {
  const { data: teams } = useTeamsQuery({ member: userId, omitMemberList: true });

  return (
    <div className="cf db">
      {teams &&
        teams.hasOwnProperty('teams') &&
        teams.teams.map((team, n) => (
          <div className="w-third-l w-50-m w-100 dib fl mv1 ph2" key={n}>
            <TeamBox team={team} className="f5 fw6 pv3 ph3 truncate shadow-4 bg-white blue-dark" />
          </div>
        ))}
    </div>
  );
};

export const UserOrganisations = ({ userId }) => {
  const { data: orgs, status } = useUserOrganisationsQuery(userId);

  return (
    <>
      {status === 'success' &&
        orgs.organisations.map((org) => (
          <div title={org.name} key={org.organisationId} className="cf ph2 pv1 tc dib">
            {org.logo ? (
              <img alt={org.name} src={org.logo} className="object-fit-contain h2 v-mid" />
            ) : (
              <span className="bg-red-light red truncate">{org.name}</span>
            )}
          </div>
        ))}
      {status === 'error' && (
        <Alert type="error" compact inline>
          <FormattedMessage {...messages.userOrganisationsError} />
        </Alert>
      )}
    </>
  );
};

import React from 'react';

import { TeamBox } from '../teamsAndOrgs/teams';
import { useFetch } from '../../hooks/UseFetch';

export const UserTeams = ({ userId }) => {
  //eslint-disable-next-line
  const [teamsError, teamsLoading, teams] = useFetch(
    `teams/?member=${userId}&omitMemberList=true`,
    userId !== undefined,
  );
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
  //eslint-disable-next-line
  const [orgsError, orgsLoading, orgs] = useFetch(
    `organisations/?manager_user_id=${userId}&omitManagerList=true`,
    userId !== undefined,
  );
  return (
    <>
      {orgs &&
        orgs.organisations &&
        orgs.organisations.map((org, n) => (
          <div title={org.name} key={n} className="cf ph2 pv1 tc dib">
            {org.logo ? (
              <img alt={org.name} src={org.logo} className="object-fit-contain h2 v-mid" />
            ) : (
              <span className="bg-red-light red truncate">{org.name}</span>
            )}
          </div>
        ))}
    </>
  );
};

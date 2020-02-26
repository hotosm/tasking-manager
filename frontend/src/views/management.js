import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { useFetch } from '../hooks/UseFetch';
import { fetchLocalJSONAPI } from '../network/genericJSONRequest';
import { isUserAdminOrPM } from '../utils/userPermissions';
import { Projects } from '../components/teamsAndOrgs/projects';
import { Teams } from '../components/teamsAndOrgs/teams';
import { ManagementMenu } from '../components/teamsAndOrgs/menu';

export function ManagementPageIndex() {
  const userDetails = useSelector(state => state.auth.get('userDetails'));
  const [projectsError, projectsLoading, projects] = useFetch(`projects/?createdByMe=true`);
  const [teamsError, teamsLoading, teams] = useFetch(
    `teams/?manager=${userDetails.id}`,
    userDetails.id !== undefined,
  );

  return (
    <>
      <Projects
        projects={!projectsLoading && !projectsError && projects}
        viewAllQuery="?createdByMe=1"
        showAddButton={true}
        ownerEntity="user"
      />
      <Teams
        isReady={!teamsLoading && !teamsError}
        teams={teams.teams}
        viewAllQuery={`?manager=${userDetails.id}`}
        showAddButton={true}
      />
    </>
  );
}

export const ManagementSection = props => {
  const userDetails = useSelector(state => state.auth.get('userDetails'));
  const token = useSelector(state => state.auth.get('token'));
  const isOrgManager = useSelector(state => state.auth.get('isOrgManager'));
  const [isProjectManagerTeamMember, setIsProjectManager] = useState(undefined);
  // if a user is trying to access a project edit page and is not an organisation manager or an admin,
  // test if they are part of a PROJECT_MANAGER team.
  if (
    props.location.pathname.startsWith('/manage/projects/') &&
    !(isOrgManager || isUserAdminOrPM(userDetails.role))
  ) {
    try {
      parseInt(props.location.pathname.replace('/manage/projects/', '').split('/')[0]);
      if (userDetails.id) {
        // We are not verifying if the user can really edit the project, only if they're part of a PM team.
        // As the API make the complete permissions check, we avoid an extra API request that way.
        fetchLocalJSONAPI(`teams/?member=${userDetails.id}&team_role=PROJECT_MANAGER`, token).then(
          teams => setIsProjectManager(teams.teams.length > 0),
        );
      }
    } catch {
      setIsProjectManager(false);
    }
  }

  return (
    <ReactPlaceholder
      type="media"
      rows={10}
      showLoadingAnimation={true}
      style={{ padding: '2rem' }}
      ready={typeof token !== undefined}
    >
      {isOrgManager || isUserAdminOrPM(userDetails.role) || isProjectManagerTeamMember ? (
        <div className="w-100 ph5-l ph2-m cf bg-tan blue-dark">
          <ManagementMenu isAdmin={userDetails && userDetails.role === 'ADMIN'} />
          {props.children}
        </div>
      ) : (
        <div className="cf w-100 pv5">
          <div className="tc">
            <h3 className="f3 fw8 mb4 barlow-condensed">
              <FormattedMessage {...messages.sectionNotAllowed} />
            </h3>
          </div>
        </div>
      )}
    </ReactPlaceholder>
  );
};

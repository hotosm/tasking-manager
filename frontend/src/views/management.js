import React from 'react';
import { useSelector } from 'react-redux';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { useFetch } from '../hooks/UseFetch';
import { Projects } from '../components/teamsAndOrgs/projects';
import { Teams } from '../components/teamsAndOrgs/teams';
import { ManagementMenu } from '../components/teamsAndOrgs/menu';
import { useSetTitleTag } from '../hooks/UseMetaTags';

export function ManagementPageIndex() {
  useSetTitleTag('Manage');
  const userDetails = useSelector((state) => state.auth.get('userDetails'));
  const [projectsError, projectsLoading, projects] = useFetch(
    `projects/?managedByMe=true&omitMapResults=true`,
  );
  const [teamsError, teamsLoading, teams] = useFetch(
    `teams/?manager=${userDetails.id}`,
    userDetails.id !== undefined,
  );

  return (
    <>
      <Projects
        projects={!projectsLoading && !projectsError && projects}
        viewAllEndpoint="/manage/projects/?managedByMe=1"
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

export const ManagementSection = (props) => {
  const userDetails = useSelector((state) => state.auth.get('userDetails'));
  const token = useSelector((state) => state.auth.get('token'));
  const isOrgManager = useSelector(
    (state) => state.auth.get('organisations') && state.auth.get('organisations').length > 0,
  );

  return (
    <ReactPlaceholder
      type="media"
      rows={10}
      showLoadingAnimation={true}
      style={{ padding: '2rem' }}
      ready={typeof token !== undefined}
    >
      {isOrgManager ||
      userDetails.role === 'ADMIN' ||
      props.location.pathname.startsWith('/manage/teams/') ||
      props.location.pathname.startsWith('/manage/projects/') ? (
        <div className="w-100 ph5-l ph2-m cf bg-tan blue-dark">
          {(isOrgManager || userDetails.role === 'ADMIN') && (
            <ManagementMenu isAdmin={userDetails && userDetails.role === 'ADMIN'} />
          )}
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

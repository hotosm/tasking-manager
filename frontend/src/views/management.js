import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import messages from './messages';
import { useFetch } from '../hooks/UseFetch';
import { Projects } from '../components/teamsAndOrgs/projects';
import { Teams } from '../components/teamsAndOrgs/teams';
import { ManagementMenu } from '../components/teamsAndOrgs/menu';
import { useSetTitleTag } from '../hooks/UseMetaTags';

export function ManagementPageIndex() {
  useSetTitleTag('Manage');
  const userDetails = useSelector((state) => state.auth.userDetails);
  const [projectsError, projectsLoading, projects] = useFetch(
    `projects/?managedByMe=true&omitMapResults=true`,
  );
  const [teamsError, teamsLoading, teams] = useFetch(
    `teams/?manager=${userDetails.id}&fullMemberList=false&paginate=true&perPage=6`,
    userDetails.id !== undefined,
  );

  return (
    <>
      <Projects
        projects={!projectsLoading && !projectsError && projects}
        viewAllEndpoint="/manage/projects/?managedByMe=1&action=any"
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
  const location = useLocation();
  const navigate = useNavigate();
  const userDetails = useSelector((state) => state.auth.userDetails);
  const token = useSelector((state) => state.auth.token);
  const isOrgManager = useSelector(
    (state) => state.auth.organisations && state.auth.organisations.length > 0,
  );

  useEffect(() => {
    if (!token) {
      navigate('/login', {
        state: {
          from: location.pathname,
        },
      });
    }
  }, [location.pathname, navigate, token]);

  return (
    <>
      {isOrgManager ||
      userDetails.role === 'ADMIN' ||
      location.pathname.startsWith('/manage/teams/') ||
      location.pathname.startsWith('/manage/projects/') ? (
        <div className="w-100 ph5-l pb5-l pb2-m ph2-m cf bg-tan blue-dark">
          {(isOrgManager || userDetails.role === 'ADMIN') && (
            <ManagementMenu isAdmin={userDetails && userDetails.role === 'ADMIN'} />
          )}
          <div className="ph0-ns ph2">
            <Outlet />
          </div>
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
    </>
  );
};

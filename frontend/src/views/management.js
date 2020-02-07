import React from 'react';
import { useSelector } from 'react-redux';

import { useFetch } from '../hooks/UseFetch';
import { Projects } from '../components/teamsAndOrgs/projects';
import { Teams } from '../components/teamsAndOrgs/teams';
import { ManagementMenu } from '../components/teamsAndOrgs/menu';

export function ManagementPageIndex() {
  const userDetails = useSelector(state => state.auth.get('userDetails'));
  // when teams and projects endpoints allow to filter by ownner/manager, replace the useFetch functions
  // const [projectsError, projectsLoading, projects] = useFetch(`projects/queries/myself/owner/`);
  // const [teamsError, teamsLoading, teams] = useFetch(`teams/?manager_user_id=${userDetails.id}`, userDetails.id);
  const [projectsError, projectsLoading, projects] = useFetch(`projects/`);
  const [teamsError, teamsLoading, teams] = useFetch(`teams/`);

  return (
    <>
      <Projects
        projects={!projectsLoading && !projectsError && projects}
        viewAllQuery="?createdByMe=1"
        showAddButton={true}
      />
      <Teams
        teams={!teamsLoading && !teamsError && teams.teams}
        viewAllQuery={`?manager=${userDetails.id}`}
        showAddButton={true}
      />
    </>
  );
}

export const ManagementSection = props => (
  <div className="w-100 ph5-l ph2-m cf bg-tan blue-dark">
    <ManagementMenu />
    {props.children}
  </div>
);

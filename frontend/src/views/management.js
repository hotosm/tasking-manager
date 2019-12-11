import React from 'react';
import { useSelector } from 'react-redux';

import { useFetch } from '../hooks/UseFetch';
import { Projects } from '../components/teamsAndOrgs/projects';
import { Teams } from '../components/teamsAndOrgs/teams';
import { ManagementMenu } from '../components/teamsAndOrgs/menu';

export function Management() {
  const userDetails = useSelector(state => state.auth.get('userDetails'));
  // when teams and projects endpoints allow to filter by ownner/manager, replace the useFetch functions
  // const [projectsError, projectsLoading, projects] = useFetch(`projects/queries/myself/owner/`);
  // const [teamsError, teamsLoading, teams] = useFetch(`teams/?manager_user_id=${userDetails.id}`, userDetails.id);
  const [projectsError, projectsLoading, projects] = useFetch(`projects/`);
  const [teamsError, teamsLoading, teams] = useFetch(`teams/`);

  return (
    <div className="w-100 ph6-l cf pb4">
      <ManagementMenu />
      <Projects projects={!projectsLoading && !projectsError && projects} viewAllQuery="queries/myself/owner/" />
      <Teams teams={!teamsLoading && !teamsError && teams.teams} viewAllQuery={`?manager=${userDetails.id}`} />
    </div>
  );
}

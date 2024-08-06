import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

export function useEditProjectAllowed(project) {
  const userDetails = useSelector((state) => state.auth.userDetails);
  const organisations = useSelector((state) => state.auth.organisations);
  const pmTeams = useSelector((state) => state.auth.pmTeams);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    // admin users can edit any project
    if (userDetails.role === 'ADMIN') setIsAllowed(true);
    // owners can edit their projects
    // project and project.author check are needed to avoid `null === null` case while data is loading
    if (project && project.author && userDetails.username === project.author) setIsAllowed(true);
    // managers of the organisation related to the project can edit it
    if (organisations && organisations.includes(project.organisation)) setIsAllowed(true);
    // users that are member of a PROJECT_MANAGER team associated with the project can edit it
    const teams = project.teams
      ? project.teams.filter((team) => team.role === 'PROJECT_MANAGER').map((team) => team.teamId)
      : [];
    if (pmTeams && pmTeams.some((item) => teams.includes(item))) {
      setIsAllowed(true);
    }
  }, [pmTeams, userDetails.role, userDetails.username, organisations, project]);
  return [isAllowed];
}

export function useEditTeamAllowed(team) {
  const userDetails = useSelector((state) => state.auth.userDetails);
  const organisations = useSelector((state) => state.auth.organisations);
  const pmTeams = useSelector((state) => state.auth.pmTeams);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    // admin users can edit any team
    if (userDetails.role === 'ADMIN') setIsAllowed(true);
    // managers of the organisation related to the team can edit it
    if (organisations && organisations.includes(team.organisation_id)) setIsAllowed(true);
    // team managers can edit it
    // verify from the redux store
    if (pmTeams && pmTeams.includes(team.teamId)) setIsAllowed(true);
    // and verify based on the team members list
    if (team.members) {
      const managers = team.members
        .filter((member) => member.active && member.function === 'MANAGER')
        .map((member) => member.username);
      if (userDetails.username && managers.includes(userDetails.username)) {
        setIsAllowed(true);
      }
    }
  }, [pmTeams, userDetails.role, userDetails.username, organisations, team]);
  return [isAllowed];
}

export function useEditOrgAllowed(org) {
  const userDetails = useSelector((state) => state.auth.userDetails);
  const organisations = useSelector((state) => state.auth.organisations);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    // admin users can edit any organisation
    if (userDetails.role === 'ADMIN') setIsAllowed(true);
    // check if user is a organisation manager
    // based on the redux store data
    if (org && org.organisationId && organisations && organisations.includes(org.organisationId)) {
      setIsAllowed(true);
    }
    // and based on the organisation data
    if (org && org.managers && org.managers.map((i) => i.username).includes(userDetails.username)) {
      setIsAllowed(true);
    }
  }, [org, organisations, userDetails.username, userDetails.role]);
  return [isAllowed];
}

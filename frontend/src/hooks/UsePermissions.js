import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

export function useEditProjectAllowed(project) {
  const userDetails = useSelector((state) => state.auth.get('userDetails'));
  const organisations = useSelector((state) => state.auth.get('organisations'));
  const pmTeams = useSelector((state) => state.auth.get('pmTeams'));
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
      .filter((team) => team.role === 'PROJECT_MANAGER')
      .map((team) => team.teamId);
    if (pmTeams && pmTeams.some((item) => teams.includes(item))) {
      setIsAllowed(true);
    }
  }, [pmTeams, userDetails.role, userDetails.username, organisations, project]);
  return [isAllowed];
}

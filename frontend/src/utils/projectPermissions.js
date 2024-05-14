export function userCanMap(user, project, userTeams = [], userOrgs = []) {
  if (user.role === 'READ_ONLY') return false;
  if (user.role === 'ADMIN') return true;
  // project author can map it
  if (user.username && user.username === project.author) return true;
  if (project.organisation && userOrgs.includes(project.organisation)) return true;
  const projectTeamsIds = project.teams
    .filter((team) => ['MAPPER', 'VALIDATOR', 'PROJECT_MANAGER'].includes(team.role))
    .map((team) => team.teamId);
  const isUserMemberOfATeam =
    userTeams.filter((team) => projectTeamsIds.includes(team.teamId)).length > 0;
  const isUserExperienced = ['INTERMEDIATE', 'ADVANCED'].includes(user.mappingLevel);

  // check for private projects
  if (project.private) {
    if (project.allowedUsernames.includes(user.username) || isUserMemberOfATeam) {
      return true;
    } else {
      return false;
    }
  }

  // if mappingPermission is ANY, all users can map
  if (project.mappingPermission === 'ANY') return true;

  // if mappingPermission is level, only INTERMEDIATE and ADVANCED users can map
  if (project.mappingPermission === 'LEVEL') {
    return isUserExperienced;
  }

  // if mappingPermission is team, only members of a project team can map
  if (project.mappingPermission === 'TEAMS') {
    return isUserMemberOfATeam;
  }

  // if mappingPermission is team, only INTERMEDIATE and ADVANCED members of a project team can map
  if (project.mappingPermission === 'TEAMS_LEVEL') {
    return isUserMemberOfATeam && isUserExperienced;
  }
}

export function userCanValidate(user, project, userTeams = [], userOrgs = []) {
  if (user.role === 'READ_ONLY') return false;
  if (user.role === 'ADMIN') return true;
  // project author can validate it
  if (user.username && user.username === project.author) return true;
  if (project.organisation && userOrgs.includes(project.organisation)) return true;
  const projectTeamsIds = project.teams
    .filter((team) => ['VALIDATOR', 'PROJECT_MANAGER'].includes(team.role))
    .map((team) => team.teamId);
  const isUserMemberOfATeam =
    userTeams.filter((team) => projectTeamsIds.includes(team.teamId)).length > 0;
  const isUserExperienced = ['INTERMEDIATE', 'ADVANCED'].includes(user.mappingLevel);

  // check for private projects
  if (project.private) {
    if (project.allowedUsernames.includes(user.username) || isUserMemberOfATeam) {
      return true;
    } else {
      return false;
    }
  }

  // if validationPermission is ANY, all users can validate
  if (project.validationPermission === 'ANY') return true;

  // if validationPermission is level, only INTERMEDIATE and ADVANCED users can validate
  if (project.validationPermission === 'LEVEL') {
    return isUserExperienced;
  }

  // if validationPermission is team, only members of a project team can validate
  if (project.validationPermission === 'TEAMS') {
    return isUserMemberOfATeam;
  }

  // if validationPermission is team, only INTERMEDIATE and ADVANCED members of a project team can validate
  if (project.validationPermission === 'TEAMS_LEVEL') {
    return isUserMemberOfATeam && isUserExperienced;
  }
}

export function getMessageOnMappingContext(taskStatus) {
  if (taskStatus) {
    if (['READY', 'INVALIDATED'].includes(taskStatus)) {
      return 'mapSelectedTask';
    }
    return 'mapAnotherTask';
  } else {
    return 'mapATask';
  }
}

export function getMessageOnValidationContext(mappingIsPossible, taskStatus) {
  if (taskStatus === 'MAPPED') {
    return 'validateSelectedTask';
  }
  if (['VALIDATED', 'LOCKED_FOR_VALIDATION'].includes(taskStatus)) {
    return 'validateAnotherTask';
  }
  if (mappingIsPossible) {
    return getMessageOnMappingContext(taskStatus);
  }
  return 'validateATask';
}

export function getTaskAction(user, project, taskStatus, userTeams = [], userOrgs = []) {
  // nothing more to do if all tasks are validated or set as BADIMAGERY
  if (project.percentValidated >= 100) {
    return 'projectIsComplete';
  }
  const validationIsPossible = userCanValidate(user, project, userTeams, userOrgs);
  const mappingIsPossible =
    userCanMap(user, project, userTeams, userOrgs) && project.percentMapped < 100;

  if (validationIsPossible) {
    return getMessageOnValidationContext(mappingIsPossible, taskStatus);
  }
  if (mappingIsPossible) {
    return getMessageOnMappingContext(taskStatus);
  }
  if (project.percentMapped >= 100) {
    return 'mappingIsComplete';
  }
  return 'selectAnotherProject';
}

export function getPermissionErrorMessage(project, userLevel) {
  if (project.percentMapped < 100) {
    if (
      project.mappingPermission === 'LEVEL' ||
      (project.mappingPermission === 'TEAMS_LEVEL' && userLevel === 'BEGINNER')
    ) {
      return 'userLevelToMap';
    }
    if (
      project.mappingPermission === 'TEAMS' ||
      (project.mappingPermission === 'TEAMS_LEVEL' && userLevel !== 'BEGINNER')
    ) {
      return 'userIsNotMappingTeamMember';
    }
  }
  if (project.percentValidated < 100) {
    if (
      project.validationPermission === 'LEVEL' ||
      (project.validationPermission === 'TEAMS_LEVEL' && userLevel === 'BEGINNER')
    ) {
      return 'userLevelToValidate';
    }
    if (
      project.validationPermission === 'TEAMS' ||
      (project.validationPermission === 'TEAMS_LEVEL' && userLevel !== 'BEGINNER')
    ) {
      return 'userIsNotValidationTeamMember';
    }
  }
}

export function userCanMap(user, project, userTeams = []) {
  if (user.role === 'READ_ONLY') return false;
  if (user.role === 'ADMIN') return true;
  const projectTeamsIds = project.teams
    .filter(team => ['MAPPER', 'VALIDATOR', 'PROJECT_MANAGER'].includes(team.role))
    .map(team => team.teamId);
  const isUserMemberOfATeam =
    userTeams.filter(team => projectTeamsIds.includes(team.teamId)).length > 0;
  const isUserExperienced = ['INTERMEDIATE', 'ADVANCED'].includes(user.mappingLevel);

  // check for private projects
  if (project.private) {
    if (project.allowedUsernames.includes(user.username) || isUserMemberOfATeam) {
      return true;
    } else {
      return false;
    }
  }

  // if mappingPermission is any, all users can map
  if (project.mappingPermission === 'any') return true;

  // if mappingPermission is level, only INTERMEDIATE and ADVANCED users can map
  if (project.mappingPermission === 'level') {
    return isUserExperienced;
  }

  // if mappingPermission is team, only members of a project team can map
  if (project.mappingPermission === 'teams') {
    return isUserMemberOfATeam;
  }

  // if mappingPermission is team, only INTERMEDIATE and ADVANCED members of a project team can map
  if (project.mappingPermission === 'teamsAndLevel') {
    return isUserMemberOfATeam && isUserExperienced;
  }
}

export function userCanValidate(user, project, userTeams = []) {
  if (user.role === 'READ_ONLY') return false;
  if (user.role === 'ADMIN') return true;
  const projectTeamsIds = project.teams
    .filter(team => ['VALIDATOR', 'PROJECT_MANAGER'].includes(team.role))
    .map(team => team.teamId);
  const isUserMemberOfATeam =
    userTeams.filter(team => projectTeamsIds.includes(team.teamId)).length > 0;
  const isUserExperienced = ['INTERMEDIATE', 'ADVANCED'].includes(user.mappingLevel);

  // check for private projects
  if (project.private) {
    if (project.allowedUsernames.includes(user.username) || isUserMemberOfATeam) {
      return true;
    } else {
      return false;
    }
  }

  // if validationPermission is any, all users can validate
  if (project.validationPermission === 'any') return true;

  // if validationPermission is level, only INTERMEDIATE and ADVANCED users can validate
  if (project.validationPermission === 'level') {
    return isUserExperienced;
  }

  // if validationPermission is team, only members of a project team can validate
  if (project.validationPermission === 'teams') {
    return isUserMemberOfATeam;
  }

  // if validationPermission is team, only INTERMEDIATE and ADVANCED members of a project team can validate
  if (project.validationPermission === 'teamsAndLevel') {
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

export function getTaskAction(user, project, taskStatus, userTeams = []) {
  // nothing more to do if all tasks are validated or set as BADIMAGERY
  if (project.percentValidated + project.percentBadImagery === 100) {
    return 'projectIsComplete';
  }
  const validationIsPossible = userCanValidate(user, project, userTeams);
  const mappingIsPossible =
    userCanMap(user, project, userTeams) && project.percentMapped + project.percentBadImagery < 100;

  if (validationIsPossible) {
    return getMessageOnValidationContext(mappingIsPossible, taskStatus);
  }
  if (mappingIsPossible) {
    return getMessageOnMappingContext(taskStatus);
  }
  if (project.percentMapped + project.percentBadImagery === 100) {
    return 'mappingIsComplete';
  }
  return 'selectAnotherProject';
}

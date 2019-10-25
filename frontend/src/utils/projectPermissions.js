export function userCanMap(user, project) {
  if (user.role === 'READ_ONLY') return false;
  if (project.private && !project.allowedUsernames.includes(user.username)) {
    return false;
  }
  if (project.restrictMappingLevelToProject === false) return true;

  const levels = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3 };
  if (levels[user.mappingLevel] < levels[project.mapperLevel]) {
    return false;
  } else {
    return true;
  }
}

export function userCanValidate(user, project) {
  if (user.role === 'READ_ONLY') return false;
  if (project.private && !project.allowedUsernames.includes(user.username)) {
    return false;
  }
  let userRolePermission = true;
  let userLevelPermission = true;
  if (project.restrictValidationRole) {
    if (['ADMIN', 'PROJECT_MANAGER', 'VALIDATOR'].includes(user.role)) {
      userRolePermission = true;
    } else {
      userRolePermission = false;
    }
  }
  if (project.restrictValidationLevelIntermediate) {
    if (['INTERMEDIATE', 'ADVANCED'].includes(user.mappingLevel)) {
      userLevelPermission = true;
    } else {
      userLevelPermission = false;
    }
  }
  return userRolePermission && userLevelPermission;
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

export function getTaskAction(user, project, taskStatus) {
  const validationIsPossible =
    userCanValidate(user, project) && project.percentValidated + project.percentBadImagery < 100;
  const mappingIsPossible =
    userCanMap(user, project) && project.percentMapped + project.percentBadImagery < 100;

  if (validationIsPossible) {
    return getMessageOnValidationContext(mappingIsPossible, taskStatus);
  }
  if (mappingIsPossible) {
    return getMessageOnMappingContext(taskStatus);
  }

  if (project.percentValidated + project.percentBadImagery === 100) {
    return 'projectIsComplete';
  }
  if (project.percentMapped + project.percentBadImagery === 100) {
    return 'mappingIsComplete';
  }
}

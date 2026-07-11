/**
 * Maps API lock SubCodes to taskSelection message keys.
 * Legacy SubCodes (e.g. UserNotAllowed) use the `${code}Error` pattern in messages.js.
 */
export const LOCK_SUBCODE_MESSAGES = {
  'MappingNotAllowed.USER_NOT_CORRECT_MAPPING_LEVEL': {
    title: 'permissionErrorTitle',
    description: 'permissionError_userLevelToMap',
  },
  'MappingNotAllowed.USER_NOT_TEAM_MEMBER': {
    title: 'permissionErrorTitle',
    description: 'permissionError_userIsNotMappingTeamMember',
  },
  'MappingNotAllowed.USER_NOT_ON_ALLOWED_LIST': {
    title: 'UserNotAllowedError',
    description: 'UserNotAllowedErrorDescription',
  },
  'MappingNotAllowed.PROJECT_NOT_PUBLISHED': {
    title: 'ProjectNotPublishedError',
    description: 'ProjectNotPublishedErrorDescription',
  },
  'MappingNotAllowed.USER_ALREADY_HAS_TASK_LOCKED': {
    title: 'lockError',
    description: 'lockErrorDescription',
  },
  'MappingNotAllowed.USER_NOT_ACCEPTED_LICENSE': {
    title: 'lockErrorLicense',
    description: 'lockErrorLicenseDescription',
  },
  'ValidatingNotAllowed.USER_NOT_CORRECT_MAPPING_LEVEL': {
    title: 'permissionErrorTitle',
    description: 'permissionError_userLevelToValidate',
  },
  'ValidatingNotAllowed.USER_NOT_TEAM_MEMBER': {
    title: 'permissionErrorTitle',
    description: 'permissionError_userIsNotValidationTeamMember',
  },
  'ValidatingNotAllowed.USER_NOT_ON_ALLOWED_LIST': {
    title: 'UserNotAllowedError',
    description: 'UserNotAllowedErrorDescription',
  },
  'ValidatingNotAllowed.PROJECT_NOT_PUBLISHED': {
    title: 'ProjectNotPublishedError',
    description: 'ProjectNotPublishedErrorDescription',
  },
};

export function normalizeLockError(error) {
  if (error && typeof error === 'object' && error.subCode) {
    return error;
  }

  return { subCode: error, detail: null };
}

export function resolveLockErrorMessages(error, messages) {
  const { subCode, detail } = normalizeLockError(error);

  const mapped = LOCK_SUBCODE_MESSAGES[subCode];
  if (mapped) {
    return {
      title: messages[mapped.title],
      description: messages[mapped.description],
    };
  }

  const legacyTitle = messages[`${subCode}Error`];
  const legacyDescription = messages[`${subCode}ErrorDescription`];
  if (legacyTitle) {
    return {
      title: legacyTitle,
      description: legacyDescription,
    };
  }

  if (detail) {
    return {
      title: messages.lockError,
      description: { id: 'project.tasks.lock_error.api_detail', defaultMessage: detail },
    };
  }

  return {
    title: messages.lockError,
    description: messages.lockErrorDescription,
  };
}

/**
 * Maps API lock SubCodes to taskSelection message keys.
 * Legacy SubCodes (e.g. UserNotAllowed) use the `${code}Error` pattern in messages.js.
 */

function lockMessages(entries) {
  return entries.reduce((acc, [suffix, title, mapDescription, validateDescription = mapDescription]) => {
    acc[`MappingNotAllowed.${suffix}`] = { title, description: mapDescription };
    if (validateDescription !== null) {
      acc[`ValidatingNotAllowed.${suffix}`] = { title, description: validateDescription };
    }
    return acc;
  }, {});
}

export const LOCK_SUBCODE_MESSAGES = lockMessages([
  [
    'USER_NOT_CORRECT_MAPPING_LEVEL',
    'permissionErrorTitle',
    'permissionError_userLevelToMap',
    'permissionError_userLevelToValidate',
  ],
  [
    'USER_NOT_TEAM_MEMBER',
    'permissionErrorTitle',
    'permissionError_userIsNotMappingTeamMember',
    'permissionError_userIsNotValidationTeamMember',
  ],
  ['USER_NOT_ON_ALLOWED_LIST', 'UserNotAllowedError', 'UserNotAllowedErrorDescription'],
  ['PROJECT_NOT_PUBLISHED', 'ProjectNotPublishedError', 'ProjectNotPublishedErrorDescription'],
  ['USER_ALREADY_HAS_TASK_LOCKED', 'lockError', 'lockErrorDescription', null],
  ['USER_NOT_ACCEPTED_LICENSE', 'lockErrorLicense', 'lockErrorLicenseDescription', null],
]);

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

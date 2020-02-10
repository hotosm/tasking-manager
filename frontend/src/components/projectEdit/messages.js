import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on project edit.
 */
export default defineMessages({
  privacy: {
    id: 'formInputs.privacy.title',
    defaultMessage: 'Privacy',
  },
  privacyDescription: {
    id: 'formInputs.privacy.description',
    defaultMessage:
      'Private means that only the users that are project team members can access, map or validate this project. This option overrides the mapping and validation permissions.',
  },
  teams: {
    id: 'formInputs.teams.title',
    defaultMessage: 'Teams',
  },
  organisation: {
    id: 'formInputs.organisation.title',
    defaultMessage: 'Organisation',
  },
  organisationDescription: {
    id: 'formInputs.organisation.description',
    defaultMessage:
      'Organisation that is coordinating the project, if there is any. The managers of that organisation will have administration rights over the project.',
  },
  selectOrganisation: {
    id: 'formInputs.organisation.select',
    defaultMessage: 'Select organisation',
  },
  permissions_ANY: {
    id: 'formInputs.permissions.any',
    defaultMessage: 'Any user',
  },
  permissions_LEVEL: {
    id: 'formInputs.permissions.level',
    defaultMessage: 'Only users with intermediate or advanced level',
  },
  permissions_TEAMS: {
    id: 'formInputs.permissions.teams',
    defaultMessage: 'Only team members',
  },
  permissions_TEAMS_LEVEL: {
    id: 'formInputs.permissions.teamsAndLevel',
    defaultMessage: 'Only intermediate and advanced team members',
  },
  mappingPermissionDescription: {
    id: 'formInputs.permissions.mapping.description',
    defaultMessage: 'Define which users can map this project.',
  },
  validationPermissionDescription: {
    id: 'formInputs.permissions.validation.description',
    defaultMessage: 'Define which users can validate this project.',
  },
  mappingPermission: {
    id: 'formInputs.permissions.mapping.title',
    defaultMessage: 'Mapping permissions',
  },
  validationPermission: {
    id: 'formInputs.permissions.validation.title',
    defaultMessage: 'Validation permissions',
  },
});

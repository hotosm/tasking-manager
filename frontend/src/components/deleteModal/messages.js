import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on delete modal.
 */
export default defineMessages({
  processing: {
    id: 'deleteModal.status.processing',
    defaultMessage: 'Processing',
  },
  success: {
    id: 'deleteModal.status.success',
    defaultMessage: '{type} deleted successfully.',
  },
  success_projects: {
    id: 'deleteModal.status.success.projects',
    defaultMessage: 'Project deleted successfully.',
  },
  failure_projects: {
    id: 'deleteModal.status.failure.projects',
    defaultMessage: 'An error occurred when trying to delete this project.',
  },
  failure_organisations: {
    id: 'deleteModal.status.failure.organisations',
    defaultMessage: 'An error occurred when trying to delete this organization.',
  },
  failure_interests: {
    id: 'deleteModal.status.failure.interests',
    defaultMessage: 'An error occurred when trying to delete this interest.',
  },
  failure_licenses: {
    id: 'deleteModal.status.failure.licenses',
    defaultMessage: 'An error occurred when trying to delete this license.',
  },
  failure_campaigns: {
    id: 'deleteModal.status.failure.campaigns',
    defaultMessage: 'An error occurred when trying to delete this campaign.',
  },
  failure_notifications: {
    id: 'deleteModal.status.failure.notifications',
    defaultMessage: 'An error occurred when trying to delete this notification.',
  },
  failure_teams: {
    id: 'deleteModal.status.failure.teams',
    defaultMessage: 'An error occurred when trying to delete this team.',
  },
  delete: {
    id: 'deleteModal.button.delete',
    defaultMessage: 'Delete',
  },
  InternalServerErrorError: {
    id: 'deleteModal.status.failure.InternalServerErrorError',
    defaultMessage:
      'Something has gone wrong on the server, but the server could not be more specific on what the exact problem is.',
  },
  HasMappedTasksError: {
    id: 'deleteModal.status.failure.HasMappedTasksError',
    defaultMessage: 'Project has mapped tasks, cannot be deleted.',
  },
  cancel: {
    id: 'deleteModal.button.cancel',
    defaultMessage: 'Cancel',
  },
  confirmDeleteTitle_projects: {
    id: 'deleteModal.title.projects',
    defaultMessage: 'Are you sure you want to delete this project?',
  },
  confirmDeleteTitle_organisations: {
    id: 'deleteModal.title.organisation',
    defaultMessage: 'Are you sure you want to delete this organization?',
  },
  confirmDeleteTitle_licenses: {
    id: 'deleteModal.title.licenses',
    defaultMessage: 'Are you sure you want to delete this license?',
  },
  confirmDeleteTitle_interests: {
    id: 'deleteModal.title.interests',
    defaultMessage: 'Are you sure you want to delete this category?',
  },
  confirmDeleteTitle_campaigns: {
    id: 'deleteModal.title.campaigns',
    defaultMessage: 'Are you sure you want to delete this campaign?',
  },
  confirmDeleteTitle_notifications: {
    id: 'deleteModal.title.notifications',
    defaultMessage: 'Are you sure you want to delete this notification?',
  },
  confirmDeleteTitle_teams: {
    id: 'deleteModal.title.teams',
    defaultMessage: 'Are you sure you want to delete this team?',
  },
  OrgHasProjectsError: {
    id: 'deleteModal.error.OrgHasProjectsError',
    defaultMessage: 'Organisation has some projects. Please delete them first.',
  },
});

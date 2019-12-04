import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on header.
 */
export default defineMessages({
  projects: {
    id: 'deleteModal.type.project',
    defaultMessage: 'project',
  },
  organisations: {
    id: 'deleteModal.type.organisation',
    defaultMessage: 'organisation',
  },
  interests: {
    id: 'deleteModal.type.interest',
    defaultMessage: 'interest',
  },
  campaigns: {
    id: 'deleteModal.type.campaign',
    defaultMessage: 'campaign',
  },
  notifications: {
    id: 'deleteModal.type.notifications',
    defaultMessage: 'notification',
  },
  teams: {
    id: 'deleteModal.type.team',
    defaultMessage: 'team',
  },
  processing: {
    id: 'deleteModal.status.processing',
    defaultMessage: 'Processing',
  },
  success: {
    id: 'deleteModal.status.success',
    defaultMessage: 'The {type} was deleted successfully.',
  },
  failure: {
    id: 'deleteModal.status.failure',
    defaultMessage: 'An error occurred when trying to delete this {type}.',
  },
  delete: {
    id: 'deleteModal.button.delete',
    defaultMessage: 'Delete',
  },
  cancel: {
    id: 'deleteModal.button.cancel',
    defaultMessage: 'Cancel',
  },
  confirmDeleteTitle: {
    id: 'deleteModal.title',
    defaultMessage: 'Confirm that you want to delete the {name} {type}?',
  },
});

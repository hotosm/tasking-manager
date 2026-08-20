import { defineMessages } from 'react-intl';

import managementMessages from '../teamsAndOrgs/messages';

const ownMessages = defineMessages({
  badgeInfo: { id: 'management.titles.badge_information', defaultMessage: 'Badge information' },
  building: { id: 'management.badges.building', defaultMessage: 'buildings added' },
  changeset: { id: 'management.badges.changeset', defaultMessage: 'Number of changesets' },
  changesets: { id: 'management.badges.changesets', defaultMessage: 'Changesets' },
  hidden: { id: 'management.badges.hidden', defaultMessage: 'Hide this badge from users' },
  highway: { id: 'management.badges.highway', defaultMessage: 'km of highways added' },
  road: { id: 'management.badges.road', defaultMessage: 'km of roads added' },
  imageError: { id: 'management.badges.imageError', defaultMessage: 'Error uploading image' },
  metric: { id: 'management.badges.metric', defaultMessage: 'Metric' },
  needsRequirements: { id: 'management.badges.needsRequirements', defaultMessage: 'Needs at least one requirement' },
  noBadges: { id: 'management.no_badges', defaultMessage: 'There are no badges yet.' },
  poi: { id: 'management.badges.poi', defaultMessage: 'Points of Interest' },
  remove: { id: 'management.remove', defaultMessage: 'Remove' },
  requirements: { id: 'management.badges.requirements', defaultMessage: 'Requirements' },
  uploadNew: { id: 'management.badges.uploadNew', defaultMessage: 'Upload new' },
  uploading: { id: 'management.badges.uploading', defaultMessage: 'Uploading...' },
  value: { id: 'management.badges.value', defaultMessage: 'Value' },
  waterway: { id: 'management.badges.waterway', defaultMessage: 'km of waterways added' },
});

// These ids are declared once, in teamsAndOrgs/messages.js. Re-export rather than
// re-declare them: duplicate ids make `yarn build-locales` fail outright.
const messages = {
  ...ownMessages,
  add: managementMessages.add,
  badges: managementMessages.badges,
  cancel: managementMessages.cancel,
  description: managementMessages.description,
  image: managementMessages.image,
  manage: managementMessages.manage,
  name: managementMessages.name,
  save: managementMessages.save,
};

export default messages;

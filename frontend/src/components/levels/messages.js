import { defineMessages } from 'react-intl';

import managementMessages from '../teamsAndOrgs/messages';

const messages = defineMessages({
  add: { id: 'management.levels.add', defaultMessage: 'Add' },
  approvals_required: { id: 'management.levels.approvals_required', defaultMessage: 'Approvals required' },
  color: { id: 'management.levels.color', defaultMessage: 'Color' },
  levelInfoTitle: { id: 'management.titles.level_information', defaultMessage: 'Level information' },
  noLevels: { id: 'management.no_levels', defaultMessage: 'There are no levels yet.' },
  peer_review: { id: 'management.levels.peer_review', defaultMessage: 'Require peer review' },
  required_badges: { id: 'management.levels.required_badges', defaultMessage: 'Required badges' },
  needsBadges: { id: 'management.levels.needsBadges', defaultMessage: 'Needs at least one badge' },
});

export default {
  ...messages,
  cancel: managementMessages.cancel,
  levels: managementMessages.levels,
  manage: managementMessages.manage,
  name: managementMessages.name,
  save: managementMessages.save,
};

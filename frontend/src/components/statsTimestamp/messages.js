import { defineMessages } from 'react-intl';

export default defineMessages({
  generic: {
    id: 'stats.ohsome.timestamp.generic',
    defaultMessage:
      'These statistics come from ohsomeNow Stats and were last updated at {formattedDate} ({timeZone}). Missing fields will be made available soon!',
  },
  project: {
    id: 'stats.ohsome.timestamp.project',
    defaultMessage:
      'These stats were retrieved using the default changeset comment of the project and were last updated at {formattedDate}',
  },
});

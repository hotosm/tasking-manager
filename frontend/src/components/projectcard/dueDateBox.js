import React from 'react';
import { FormattedMessage, FormattedRelative, injectIntl, intlShape } from 'react-intl';
import humanizeDuration from 'humanize-duration';

import { ClockIcon } from '../svgIcons';
import messages from './messages';

export function DueDateBox({ intl, dueDate }: Object) {
  if (dueDate === undefined) {
    return null;
  } else if (new Date(dueDate) === undefined) {
    return null;
  }
  const milliDifference = new Date(dueDate) - Date.now();
  const langCodeOnly = intl.locale.slice(0, 2);

  if (milliDifference > 0) {
    return (
      <span className="fr relative w-40 lh-solid f7 tr br1 link ph1 pv2 bg-grey-light blue-grey truncate mw4">
        <span>
          <ClockIcon className="absolute pl1 top-0 pt1 left-0" />
        </span>
        <FormattedMessage
          className="indent"
          {...messages['dueDateRelativeRemainingDays']}
          values={{
            daysLeft: <FormattedRelative value={dueDate} />,
            daysLeftHumanize: humanizeDuration(milliDifference, {
              language: langCodeOnly,
              fallbacks: ['en'],
              largest: 1,
            }),
          }}
        />
      </span>
    );
  } else {
    return null;
  }
}

DueDateBox.propTypes = {
  intl: intlShape.isRequired,
};

//decorator pattern to provide the intl object from IntlProvider into function props.
export default injectIntl(DueDateBox);

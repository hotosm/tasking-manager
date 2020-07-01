import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { ClockIcon } from '../svgIcons';

export function PriorityBox({ priority, extraClasses, hideMediumAndLow, showIcon }: Object) {
  // hideMediumAndLow option will make the priority not be rendered if it's MEDIUM or LOW
  let color = 'blue-grey b--blue-grey';
  if (priority === 'URGENT') color = 'red b--red';
  if (priority === 'HIGH') color = 'orange b--orange';

  if (!hideMediumAndLow || ['URGENT', 'HIGH'].includes(priority)) {
    return (
      <FormattedMessage {...messages[`priorityDescription${priority}`]}>
        {(msg) => (
          <div className={`tc br1 f7 ttu ba ${color} ${extraClasses}`} title={msg}>
            {showIcon && <ClockIcon className={`${color} v-mid mr1`} style={{ height: '13px' }} />}
            {priority ? (
              <span className="v-mid">
                <FormattedMessage {...messages[`projectPriority${priority}`]} />
              </span>
            ) : (
              ''
            )}
          </div>
        )}
      </FormattedMessage>
    );
  } else {
    return <></>;
  }
}

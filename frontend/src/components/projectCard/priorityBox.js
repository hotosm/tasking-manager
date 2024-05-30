import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { ClockIcon } from '../svgIcons';

export function PriorityBox({ priority, extraClasses, showIcon }: Object) {
  let color = 'blue-grey b--blue-grey';
  if (priority === 'URGENT') color = 'red b--red';
  if (priority === 'HIGH') color = 'orange b--orange';

  return (
    <FormattedMessage {...messages[`priorityDescription${priority}`]}>
      {(msg) => (
        <div className={`tc br1 f8 ttu ba ${color} ${extraClasses}`} title={msg}>
          {showIcon && <ClockIcon className={`${color} v-mid mr1`} style={{ height: '13px' }} />}
          {priority ? (
            <span className="v-mid fw5">
              <FormattedMessage {...messages[`projectPriority${priority}`]} />
            </span>
          ) : (
            ''
          )}
        </div>
      )}
    </FormattedMessage>
  );
}

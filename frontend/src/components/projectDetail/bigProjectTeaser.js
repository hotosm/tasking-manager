import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { RelativeTimeWithUnit } from '../../utils/formattedRelativeTime';

export function BigProjectTeaser({
  lastUpdated,
  totalContributors,
  className,
  littleFont = 'f7',
  bigFont = 'f6',
}: Object) {
  /* outerDivStyles must have f6 even if sub-divs have f7 to fix grid issues*/
  const outerDivStyles = 'f6 tl blue-grey truncate mb2';
  return (
    <div className="cf bg-white blue-dark">
      <div className={`fl ${outerDivStyles} ${className}`}>
        <span className={`${littleFont} blue-light`}>
          <FormattedMessage
            {...messages['projectTotalContributors']}
            values={{
              number: <span className={`blue-dark b ${bigFont}`}>{totalContributors || 0}</span>,
            }}
          />
        </span>
      </div>
      <div title={lastUpdated} className={`fr ${outerDivStyles} ${className || ''}`}>
        <span className={littleFont} title={lastUpdated}>
          <FormattedMessage {...messages['projectLastContribution']} />{' '}
          <RelativeTimeWithUnit date={lastUpdated} />
        </span>
      </div>
    </div>
  );
}

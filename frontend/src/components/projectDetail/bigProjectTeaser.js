import React from 'react';
import { FormattedMessage, FormattedRelative } from 'react-intl';
import messages from './messages';

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
      <div className="cf">
        <div className={`fl ${outerDivStyles} ${className}`}>
          <span className={`${littleFont} blue-light`}>
            <FormattedMessage
              {...messages['projectTotalContributors']}
              values={{
                number: <span className={`blue-grey b ${bigFont}`}>{totalContributors || 0}</span>,
              }}
            />
          </span>
        </div>
        <div className={`fr ${outerDivStyles} ${className}`}>
          <span className={littleFont}>
            <FormattedMessage {...messages['projectLastContribution']} />{' '}
            <FormattedRelative value={lastUpdated} />
          </span>
        </div>
      </div>
    );
  }
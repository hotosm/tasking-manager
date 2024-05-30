import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { RelativeTimeWithUnit } from '../../utils/formattedRelativeTime';

export function BigProjectTeaser({ lastUpdated, totalContributors }: Object) {
  return (
    <div className="flex justify-between mt4 mb3 blue-grey">
      <span>
        {totalContributors ? (
          <FormattedMessage
            {...messages.projectTotalContributors}
            values={{
              number: totalContributors,
              b: (chunks) => <span className="blue-dark b f125">{chunks}</span>,
            }}
          />
        ) : (
          <FormattedMessage {...messages.noProjectContributors} />
        )}
      </span>
      <span title={lastUpdated}>
        <FormattedMessage {...messages['projectLastContribution']} />
        &nbsp;
        <RelativeTimeWithUnit date={lastUpdated} />
      </span>
    </div>
  );
}

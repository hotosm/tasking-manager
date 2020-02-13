import React from 'react';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

export const PermissionBox = ({ permission, validation = false, className }: Object) => {
  const teamString = (
    <span className={`${permission === 'TEAMS_LEVEL' ? 'ttl' : ''}`}>
      {validation ? (
        <FormattedMessage {...messages.validationTeam} />
      ) : (
        <FormattedMessage {...messages.team} />
      )}
    </span>
  );

  return (
    <ReactPlaceholder
      showLoadingAnimation={true}
      type="rect"
      style={{ width: 150, height: 30 }}
      delay={100}
      ready={typeof permission === 'string'}
    >
      <div className={`tc br1 f6 ba ${className}`}>
        <FormattedMessage
          {...messages[`permissions_${permission}`]}
          values={{ team: teamString }}
        />
      </div>
    </ReactPlaceholder>
  );
};

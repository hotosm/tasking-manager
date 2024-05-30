import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

export const ProjectStatusBox = ({ status, className }: Object) => {
  const colour = status === 'DRAFT' ? 'orange' : 'blue-grey';
  return (
    <div className={`tc br1 f7 ttu ba b--${colour} ${colour} ${className}`}>
      <FormattedMessage {...messages[`status_${status}`]} />
    </div>
  );
};

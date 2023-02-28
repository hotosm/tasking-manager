import React from 'react';
import { FormattedMessage } from 'react-intl';

import { LockIcon } from '../svgIcons';
import messages from './messages';

export const ProjectVisibilityBox = ({ className }: Object) => {
  return (
    <div className={`tc br1 f7 ttu ba b--red red ${className}`}>
      <LockIcon title="lock" className="red v-mid mr1" style={{ height: '13px', width: '13px' }} />
      <FormattedMessage {...messages.private} />
    </div>
  );
};

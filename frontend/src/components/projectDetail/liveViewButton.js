import React from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { CustomButton } from '../button';

export const LiveViewButton = ({ projectId, className, compact = false }) => (
  <Link to={`/projects/${projectId}/live`} className="pr2">
    {
      <CustomButton className={className}>
        {compact ? (
          <FormattedMessage {...messages.live} />
        ) : (
          <FormattedMessage {...messages.liveMonitoring} />
        )}
      </CustomButton>
    }
  </Link>
);
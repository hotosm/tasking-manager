import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { LockIcon } from '../svgIcons';
import { Button } from '../button';

const PrivateProjectError = () => {
  const navigate = useNavigate();

  return (
    <div className="cf w-100 pv5">
      <div className="tc">
        <LockIcon style={{ height: 60, width: 60 }} />
        <h3 className="f1 fw8 mb4 barlow-condensed">
          <FormattedMessage {...messages.inaccessibleProjectTitle} />
        </h3>
        <p>
          <FormattedMessage {...messages.inaccessibleProjectDescription} />
        </p>
        <Button onClick={() => navigate(`/explore`)} className="bg-red white f5 mt3">
          <FormattedMessage {...messages.exploreOtherProjects} />
        </Button>
      </div>
    </div>
  );
};

export default PrivateProjectError;

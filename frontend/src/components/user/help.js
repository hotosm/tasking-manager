import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

export function HelpCard() {
  return (
    <div className="cf bg-white shadow-4 pa4">
      <h3 className="mt0">
        <FormattedMessage {...messages.helpTitle} />
      </h3>
      <p>
        <a href="help" className="link red pr4">
          <FormattedMessage {...messages.howToMap} />
        </a>
        <a href="help" className="link red pr4">
          <FormattedMessage {...messages.howToMapBuildings} />
        </a>
        <a href="help" className="link red">
          <FormattedMessage {...messages.whatIsOSM} />
        </a>
      </p>
    </div>
  );
}

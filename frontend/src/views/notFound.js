import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

export class NotFound extends React.Component {
  render() {
    return (
      <div className="cf w-100 pv5">
        <div className="tc">
          <h3 className="f1 fw8 mb4 barlow-condensed">
            <FormattedMessage {...messages.pageNotFound} />
          </h3>
          <p>
            <FormattedMessage {...messages.notFoundLead} />
          </p>
        </div>
      </div>
    );
  }
}

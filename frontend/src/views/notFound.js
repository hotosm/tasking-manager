import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

export const NotFound = props => {
  return (
    <div className="cf w-100 pv5">
      <div className="tc">
        {props.projectId ? (
            <h3 className="f1 fw8 mb4 barlow-condensed">
              <FormattedMessage {...messages.projectNotFound} values={{ id: props.projectId }} />
            </h3>
          ) : (
            <h3 className="f1 fw8 mb4 barlow-condensed">
              <FormattedMessage {...messages.pageNotFound} />
            </h3>
          )
        }
        <p>
          <FormattedMessage {...messages.notFoundLead} />
        </p>
      </div>
    </div>
  );
}

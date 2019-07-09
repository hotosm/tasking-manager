import React from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';

import messages from './messages';


export function MappingFlow() {
  return(
    <div className="bg-white black">
      <div className="pl6-l pl4 pv3">
        <h3 className="mb4 mw7-l lh-copy f2 fw6">
          <FormattedMessage {...messages.mappingFlowTitle} values={{number: <FormattedNumber value={100000} />}} />
        </h3>
        <p className="pr2 f5 f4-ns blue-dark lh-title mw7 mb4">
          <FormattedMessage {...messages.mappingFlowHeadline} />
        </p>
      </div>
    </div>
  );
}

import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

export function QualityAssurance({ qualityAssurance }: Object) {
  return (
    <div className="cf pb3 blue-dark">
      <span className="fw6">
        <FormattedMessage {...messages.qualityAssurance} />:
      </span>
      <span className="pl2">{qualityAssurance}</span>
    </div>
  );
}

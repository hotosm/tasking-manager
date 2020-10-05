import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from '../messages';

export const CustomField = (props) => {
  const labelClasses = 'db blue-dark f4 fw6';
  const leftColClasses = 'w-100 w-60-m w-70-l fl';
  const rightColClasses = 'w-100 w-40-m w-30-l pb4 pb0-ns fl tr-ns';
  return (
    <div className="cf pb3">
      <div className={leftColClasses}>
        <label className={labelClasses}>
          <FormattedMessage {...messages[props.labelId]} />
        </label>
        <p>
          <FormattedMessage {...messages[props.descriptionId]} />
        </p>
      </div>
      <div className={rightColClasses}>{props.children}</div>
    </div>
  );
};

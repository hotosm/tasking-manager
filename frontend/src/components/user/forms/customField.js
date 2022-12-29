import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from '../messages';

export const CustomField = (props) => {
  const labelClasses = 'db blue-dark f125 fw6 lh-solid mb2';
  const rightColClasses = 'w-100 w-40-m w-30-l pb4 pb0-ns fl tr-ns mt3 mt0-ns';

  return (
    <div className="cf pb4">
      <label className={labelClasses}>
        <FormattedMessage {...messages[props.labelId]} />
      </label>
      <div
        className={`flex items-center justify-between ${
          props.isDropdown ? 'flex-row-ns flex-column' : ''
        }`}
      >
        <p className="ma0 lh-base blue-grey mr4">
          <FormattedMessage {...messages[props.descriptionId]} />
        </p>
        <div className={rightColClasses}>{props.children}</div>
      </div>
    </div>
  );
};

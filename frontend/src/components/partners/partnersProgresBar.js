import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { ProgressBar } from '../progressBar';

export default function PartnersProgresBar({
  totalData,
  percentValidated,
  label,
  value,
  small = true,
}: Object) {

  return (
    <>
    
      <ProgressBar
        className={"bg-white"}
        firstBarValue={0}
        secondBarValue={percentValidated}
        height="half"
        small={small}
      >
        <p className="lh-copy ma0 white f7 fw4">
          {value}{" "}
          <FormattedMessage
            {...messages[label]}
          />
        </p>
      </ProgressBar>
    </>
  );
}

import React from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';

import messages from './messages';
import { PROFILE_RELEVANT_FIELDS } from './forms/personalInformation';

function CompletenessProgressBar({ completeness }: Object) {
  return (
    <>
      <div className="cf db pt1 flex items-center">
        <div className="w-90 pr3 fl relative">
          <div
            className={'absolute bg-red br-pill hhalf hide-child'}
            style={{ width: `${completeness.toPrecision(3) * 100}%` }}
          ></div>
          <div className={'bg-tan br-pill hhalf hide-child overflow-y-hidden'}></div>
        </div>
        <div className="w-10 fl pl1 fw7">
          <FormattedNumber
            value={completeness}
            maximumFractionDigits={0}
            style="percent" // eslint-disable-line react/style-prop-object
          />
        </div>
      </div>
    </>
  );
}

export function calculateCompleteness(userDetails) {
  return (
    PROFILE_RELEVANT_FIELDS.filter((k) => userDetails[k]).length / PROFILE_RELEVANT_FIELDS.length
  );
}

export function ProfileCompleteness({ userDetails }: Object) {
  const completeness = calculateCompleteness(userDetails);
  return (
    <div className="bg-white ph3 pv3 mr4">
      <h3 className="blue-dark f4 ma0 fw7">
        <FormattedMessage {...messages.completenessTitle} />
      </h3>
      <p className="blue-grey mt2">
        {completeness === 0 && <FormattedMessage {...messages.completenessLead0} />}
        {completeness > 0 && completeness < 1 && (
          <FormattedMessage {...messages.completenessLead1} />
        )}
        {completeness === 1 && <FormattedMessage {...messages.completenessLead2} />}
      </p>
      <CompletenessProgressBar completeness={completeness} />
    </div>
  );
}

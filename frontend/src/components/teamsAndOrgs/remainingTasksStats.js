import React from 'react';
import ReactTooltip from 'react-tooltip';
import { FormattedMessage, FormattedNumber, useIntl } from 'react-intl';

import messages from './messages';
import { StatsCardContent } from '../statsCardContent';
import { InfoIcon } from '../svgIcons';

const ActionsNeededLabel = () => {
  const intl = useIntl();
  return (
    <>
      <span data-tip={intl.formatMessage(messages.actionsNeededHelp)}>
        <FormattedMessage {...messages.actionsNeeded} />
        <InfoIcon className="blue-grey h1 w1 v-mid pb1 ml2" />
      </span>
      <ReactTooltip place="bottom" className="mw6" effect="solid" />
    </>
  );
};

export function RemainingTasksStats({ tasks }) {
  const mappingNeeded = tasks.ready + tasks.invalidated + tasks.lockedForMapping;
  const validationNeeded = tasks.mapped + tasks.lockedForValidation;
  return (
    <>
      <div className="pa2 w-25-l w-50-m w-100 fl">
        <div className="cf pa3 bg-white shadow-4">
          <StatsCardContent
            label={<FormattedMessage {...messages.toBeMapped} />}
            className="tc"
            value={<FormattedNumber value={mappingNeeded} />}
          />
        </div>
      </div>
      <div className="pa2 w-25-l w-50-m w-100 fl">
        <div className="cf pa3 bg-white shadow-4">
          <StatsCardContent
            label={<FormattedMessage {...messages.readyForValidation} />}
            className="tc"
            value={<FormattedNumber value={validationNeeded} />}
          />
        </div>
      </div>
      <div className="pa2 w-25-l w-100 fl">
        <div className="cf pa3 bg-white shadow-4">
          <StatsCardContent
            label={<ActionsNeededLabel />}
            className="tc"
            // each task that needs to be mapped, also needs to be validated,
            // that is the reason why we multiple by 2
            value={<FormattedNumber value={mappingNeeded * 2 + validationNeeded} />}
          />
        </div>
      </div>
    </>
  );
}

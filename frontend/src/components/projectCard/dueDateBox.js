import React, { useState, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import humanizeDuration from 'humanize-duration';
import ReactTooltip from 'react-tooltip';

import { ClockIcon } from '../svgIcons';
import messages from './messages';

export function DueDateBox({ dueDate, intervalMili, align = 'right', tooltipMsg }: Object) {
  const intl = useIntl();
  const [timer, setTimer] = useState(Date.now());
  useEffect(() => {
    let interval;
    if (intervalMili) {
      interval = setInterval(() => {
        setTimer(Date.now());
      }, intervalMili); // 1 minute
    }
    return () => {
      clearInterval(interval);
    };
  }, [intervalMili]);

  if (dueDate === undefined || new Date(dueDate) === undefined) {
    return null;
  }

  let options = { language: intl.locale.slice(0, 2), fallbacks: ['en'], largest: 1 };

  if (intervalMili !== undefined) {
    options = { units: ['h', 'm'], round: true };
  }
  const milliDifference = new Date(dueDate) - timer;

  if (milliDifference > 0) {
    return (
      <>
        <span
          className={`dib relative lh-solid f7 tr br1 link ph1 pv2 truncate ${
            align === 'right' ? 'fr' : 'fl'
          } ${
            milliDifference < 60000 * 20 && intervalMili !== undefined
              ? 'bg-red white fw6'
              : 'bg-grey-light blue-grey'
          } ${intervalMili ? '' : 'mw4'}`}
          data-tip={tooltipMsg}
        >
          <span>
            <ClockIcon className="absolute pl1 top-0 pt1 left-0" />
          </span>
          <span className="pl3 ml1 v-mid">
            <FormattedMessage
              className="indent"
              {...messages['dueDateRelativeRemainingDays']}
              values={{
                daysLeftHumanize: humanizeDuration(milliDifference, options),
              }}
            />
          </span>
        </span>
        {tooltipMsg && <ReactTooltip place="bottom" />}
      </>
    );
  } else {
    return null;
  }
}

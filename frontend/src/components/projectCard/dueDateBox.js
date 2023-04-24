import { useState, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import humanizeDuration from 'humanize-duration';
import { Tooltip } from 'react-tooltip';

import { ClockIcon } from '../svgIcons';
import messages from './messages';
import { TimerIcon } from '../svgIcons/timer';

export function DueDateBox({
  dueDate,
  intervalMili,
  tooltipMsg,
  isTaskStatusPage = false,
  isProjectDetailPage = false,
}: Object) {
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
          className={`inline-flex items-center lh-solid f8 br1 ph2 link ${
            milliDifference < 60000 * 20 && intervalMili !== undefined
              ? 'bg-red white'
              : 'bg-tan blue-grey'
          } ${intervalMili ? '' : 'mw4'}`}
          data-tooltip-id="dueDateBoxTooltip"
          style={{ paddingTop: '0.375rem', paddingBottom: '0.375rem' }}
        >
          {!isTaskStatusPage ? (
            <ClockIcon height="12px" width="12px" />
          ) : (
            <TimerIcon height="12px" width="12px" />
          )}
          <span className="pl1">
            <FormattedMessage
              className="indent"
              {...messages['dueDateRelativeRemainingDays']}
              values={{
                daysLeftHumanize: humanizeDuration(milliDifference, options),
              }}
            />
          </span>
        </span>
        {tooltipMsg && <Tooltip place="bottom" id="dueDateBoxTooltip" content={tooltipMsg} />}
      </>
    );
  } else {
    return (
      isProjectDetailPage && (
        <span
          className="inline-flex items-center lh-solid f8 br1 ph2 link bg-tan blue-grey"
          style={{ paddingTop: '0.375rem', paddingBottom: '0.375rem' }}
        >
          <ClockIcon height="12px" width="12px" />
          <span className="pl1">
            {dueDate ? (
              <FormattedMessage {...messages.dueDateExpired} />
            ) : (
              <FormattedMessage {...messages.noDueDate} />
            )}
          </span>
        </span>
      )
    );
  }
}

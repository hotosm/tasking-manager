import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { TaskStatus } from './taskList';
import { LockIcon } from '../svgIcons';

export function TasksMapLegend() {
  const lineClasses = 'mv2 blue-dark f5';
  return (
    <div className="cf left-1 bottom-2 absolute bg-white pa2 br1">
      <h4 className="fw6 f4 ttu barlow-condensed mt0 mb2">
        <FormattedMessage {...messages.legend} />
      </h4>
      <div>
        <p className={lineClasses}>
          <TaskStatus status="READY" />
        </p>
        <p className={lineClasses}>
          <TaskStatus status="MAPPED" />
        </p>
        <p className={lineClasses}>
          <TaskStatus status="INVALIDATED" />
        </p>
        <p className={lineClasses}>
          <TaskStatus status="VALIDATED" />
        </p>
        <p className={lineClasses}>
          <TaskStatus status="BADIMAGERY" />
        </p>
        <p className={lineClasses}>
          <TaskStatus status="PRIORITY_AREAS" />
        </p>
        <p className={lineClasses}>
          <LockIcon style={{ paddingTop: '1px' }} className="v-mid h1 w1" />
          <span className="pl2 v-mid">
            <FormattedMessage {...messages[`taskStatus_LOCKED`]} />
          </span>
        </p>
      </div>
    </div>
  );
}

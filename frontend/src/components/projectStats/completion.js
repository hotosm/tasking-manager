import React from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';

import messages from './messages';

export const CompletionStats = ({ tasksByStatus }: Object) => {
  const tasksToMap = tasksByStatus.invalidated + tasksByStatus.ready;
  const tasksToValidate =
    tasksByStatus.totalTasks -
    tasksByStatus.validated -
    tasksByStatus.lockedForValidation -
    tasksByStatus.badImagery;
  return (
    <div className="w-100 fl tc">
      <div className="w-100-l w-50 fl pv4">
        <h3 className="ma0 mb2 barlow-condensed f1 b red">
          <FormattedNumber value={tasksToMap} />
          <span className="dib f3 pl2 blue-grey">/ {tasksByStatus.totalTasks}</span>
        </h3>
        <span className="ma0 h2 f4 fw6 blue-grey ttl">
          <FormattedMessage {...messages.tasksToMap} />
        </span>
      </div>
      <div className="w-100-l w-50 fl pv4">
        <h3 className="ma0 mb2 barlow-condensed f1 b red">
          <FormattedNumber value={tasksToValidate} />
        </h3>
        <span className="ma0 h2 f4 fw6 blue-grey ttl">
          <FormattedMessage {...messages.tasksToValidate} />
        </span>
      </div>
    </div>
  );
};

import { FormattedMessage, FormattedNumber } from 'react-intl';

import messages from './messages';
import { StatsCardContent } from '../statsCard';
import { useTotalTasksStats } from '../../hooks/UseTotalTasksStats';

export function TasksStatsSummary({ stats }) {
  const totalStats = useTotalTasksStats(stats);
  return (
    <>
      <div className="pa2 w-25-l w-50-m w-100 fl">
        <div className="cf pa3 bg-white shadow-4">
          <StatsCardContent
            label={<FormattedMessage {...messages.tasksMapped} />}
            className="tc"
            value={<FormattedNumber value={totalStats.mapped} />}
          />
        </div>
      </div>
      <div className="pa2 w-25-l w-50-m w-100 fl">
        <div className="cf pa3 bg-white shadow-4">
          <StatsCardContent
            label={<FormattedMessage {...messages.tasksValidated} />}
            className="tc"
            value={<FormattedNumber value={totalStats.validated} />}
          />
        </div>
      </div>
      <div className="pa2 w-25-l w-100 fl">
        <div className="cf pa3 bg-white shadow-4">
          <StatsCardContent
            label={<FormattedMessage {...messages.completedActions} />}
            className="tc"
            value={<FormattedNumber value={totalStats.mapped + totalStats.validated} />}
          />
        </div>
      </div>
    </>
  );
}

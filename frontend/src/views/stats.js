import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { useTasksStatsQueryParams, useTasksStatsQueryAPI } from '../hooks/UseTasksStatsQueryAPI';
import { useSetTitleTag } from '../hooks/UseMetaTags';
import { TasksStats } from '../components/teamsAndOrgs/tasksStats';
import { NewUsersStats } from '../components/teamsAndOrgs/newUsersStats';
import { FeatureStats } from '../components/teamsAndOrgs/featureStats';

export const Stats = () => {
  useSetTitleTag('Stats');
  const [query, setQuery] = useTasksStatsQueryParams();
  const [apiState, fetchTasksStatistics] = useTasksStatsQueryAPI({ taskStats: [] }, query);

  return (
    <div className="w-100 cf pv4">
      <div className="w-100 fl cf">
        <h3 className="f2 ma0 ttu barlow-condensed blue-dark dib v-mid">
          <FormattedMessage {...messages.statistics} />
        </h3>
        <h4 className="f3 fw6 ttu barlow-condensed blue-dark mt0 pt4 mb3">
          <FormattedMessage {...messages.tasksStatistics} />
        </h4>
        <div className="pv3 ph2 bg-white blue-dark">
          <TasksStats
            query={query}
            setQuery={setQuery}
            stats={apiState.stats}
            error={apiState.isError}
            loading={apiState.isLoading}
            retryFn={fetchTasksStatistics}
          />
        </div>
      </div>
      <div className="w-100 fl cf mt3">
        <h4 className="f3 fw6 ttu barlow-condensed blue-dark mt0 pt4 mb3">
          <FormattedMessage {...messages.newUsers} />
        </h4>
        <div className="w-third-l w-50-m w-100 dib ph2">
          <NewUsersStats datePeriod="week" />
        </div>
        <div className="w-third-l w-50-m w-100 dib ph2">
          <NewUsersStats datePeriod="month" />
        </div>
      </div>
      <div className="w-100 fl cf mt3 pb3">
        <FeatureStats />
      </div>
    </div>
  );
};

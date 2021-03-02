import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from '@reach/router';
import { format, startOfYear } from 'date-fns';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { useTasksStatsQueryParams, useTasksStatsQueryAPI } from '../hooks/UseTasksStatsQueryAPI';
import { useForceUpdate } from '../hooks/UseForceUpdate';
import { useSetTitleTag } from '../hooks/UseMetaTags';
import { TasksStats } from '../components/teamsAndOrgs/tasksStats';
import { NewUsersStats } from '../components/teamsAndOrgs/newUsersStats';
import { FeatureStats } from '../components/teamsAndOrgs/featureStats';

export const Stats = () => {
  useSetTitleTag('Stats');
  const token = useSelector((state) => state.auth.get('token'));
  const [query, setQuery] = useTasksStatsQueryParams();
  const [forceUpdated, forceUpdate] = useForceUpdate();
  useEffect(() => {
    if (!query.startDate) {
      setQuery({ ...query, startDate: format(startOfYear(Date.now()), 'yyyy-MM-dd') }, 'replaceIn');
    }
  });
  const [apiState] = useTasksStatsQueryAPI(
    { taskStats: [] },
    query,
    query.startDate ? forceUpdated : false,
  );

  if (token) {
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
              retryFn={forceUpdate}
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
          <h4 className="f3 fw6 ttu barlow-condensed blue-dark mt0 pt4 mb3">
            <FormattedMessage {...messages.totalFeatures} />
          </h4>
          <FeatureStats />
        </div>
      </div>
    );
  } else {
    return <Redirect from={`stats/`} to={'/login'} noThrow />;
  }
};

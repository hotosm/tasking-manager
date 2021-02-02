import React, { useEffect } from 'react';
import { startOfYear, format } from 'date-fns';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { useTasksStatsQueryParams, useTasksStatsQueryAPI } from '../hooks/UseTasksStatsQueryAPI';
import { useForceUpdate } from '../hooks/UseForceUpdate';
import { useTotalTasksStats } from '../hooks/UseTotalTasksStats';
import { useCurrentYearStats } from '../hooks/UseOrgYearStats';
import { useFetch } from '../hooks/UseFetch';
import { useSetTitleTag } from '../hooks/UseMetaTags';
import { RemainingTasksStats } from '../components/teamsAndOrgs/remainingTasksStats';
import { OrganisationUsageLevel } from '../components/teamsAndOrgs/orgUsageLevel';
const TasksStats = React.lazy(() => import('../components/teamsAndOrgs/tasksStats'));

export const OrganisationStats = ({ id }) => {
  const [query, setQuery] = useTasksStatsQueryParams();
  const [forceUpdated, forceUpdate] = useForceUpdate();
  useEffect(() => {
    if (!query.startDate) {
      setQuery({ ...query, startDate: format(startOfYear(Date.now()), 'yyyy-MM-dd') });
    }
  });
  const [apiState] = useTasksStatsQueryAPI(
    { taskStats: [] },
    query,
    query.startDate ? forceUpdated : false,
    `organisationId=${id}`,
  );
  const [error, loading, organisation] = useFetch(`organisations/${id}/?omitManagerList=true`, id);
  const [errorOrgStats, loadingOrgStats, orgStats] = useFetch(
    `organisations/${id}/statistics/`,
    id,
  );
  const totalStats = useTotalTasksStats(useCurrentYearStats(id, query, apiState.stats));
  useSetTitleTag(`${organisation.name || 'Organization'} stats`);

  return (
    <ReactPlaceholder
      showLoadingAnimation={true}
      rows={26}
      ready={!error && !loading}
      className="pv3 ph2 ph4-ns"
    >
      <div className="w-100 cf pv3 ph2 ph4-ns bg-white blue-dark">
        <img src={organisation.logo} className="w3 dib v-mid mr3" alt={organisation.name} />
        <h3 className="f2 fw6 mv2 ttu barlow-condensed blue-dark dib v-mid">{organisation.name}</h3>
        <div className="w-100 fl cf">
          <h4 className="f3 fw6 ttu barlow-condensed blue-dark mt0 pt4 mb3">
            <FormattedMessage {...messages.tasksStatistics} />
          </h4>
          <React.Suspense fallback={<div className={`w7 h5`}>Loading...</div>}>
            <TasksStats
              query={query}
              setQuery={setQuery}
              stats={apiState.stats}
              error={apiState.isError}
              retryFn={forceUpdate}
            />
          </React.Suspense>
        </div>
        <div className="w-100 fl cf">
          <h4 className="f3 fw6 ttu barlow-condensed blue-dark mt0 pt4 mb2">
            <FormattedMessage {...messages.remainingTasks} />
          </h4>
          <ReactPlaceholder
            showLoadingAnimation={true}
            rows={5}
            delay={500}
            ready={!errorOrgStats && !loadingOrgStats}
          >
            <RemainingTasksStats tasks={orgStats && orgStats.activeTasks} />
          </ReactPlaceholder>
        </div>
        <div className="w-100 fl cf">
          <h4 className="f3 fw6 ttu barlow-condensed blue-dark mt0 pt4 mb2">
            <FormattedMessage {...messages.usageLevel} />
          </h4>
          <ReactPlaceholder showLoadingAnimation={true} rows={5} delay={500} ready={totalStats}>
            <OrganisationUsageLevel
              orgName={organisation.name}
              completedActions={totalStats.mapped + totalStats.validated}
            />
          </ReactPlaceholder>
        </div>
      </div>
    </ReactPlaceholder>
  );
};

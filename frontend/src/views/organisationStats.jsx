import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { useTasksStatsQueryParams, useTasksStatsQueryAPI } from '../hooks/UseTasksStatsQueryAPI';
import { useTotalTasksStats } from '../hooks/UseTotalTasksStats';
import { useCurrentYearStats } from '../hooks/UseOrgYearStats';
import { useFetch } from '../hooks/UseFetch';
import { useSetTitleTag } from '../hooks/UseMetaTags';
import { RemainingTasksStats } from '../components/teamsAndOrgs/remainingTasksStats';
import { OrganisationUsageLevel, OrganisationTier } from '../components/teamsAndOrgs/orgUsageLevel';
import { TasksStats } from '../components/teamsAndOrgs/tasksStats';
import { OrganisationProjectStats } from '../components/teamsAndOrgs/organisationProjectStats';

export const OrganisationStats = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const token = useSelector((state) => state.auth.token);
  const isOrgManager = useSelector(
    (state) =>
      state.auth.userDetails.role === 'ADMIN' || state.auth.organisations?.includes(Number(id)),
  );
  const [query, setQuery] = useTasksStatsQueryParams();

  const [apiState, fetchTasksStatistics] = useTasksStatsQueryAPI(
    { taskStats: [] },
    query,
    `organisationId=${id}`,
  );
  const [error, loading, organisation] = useFetch(`organisations/${id}/?omitManagerList=true`, id);
  const [errorOrgStats, loadingOrgStats, orgStats] = useFetch(
    `organisations/${id}/statistics/`,
    id,
  );
  const currentYearStats = useCurrentYearStats(id, query, apiState.stats);
  const totalStats = useTotalTasksStats(currentYearStats);
  const completedActions = totalStats.mapped + totalStats.validated;
  const showTierInfo =
    ['DISCOUNTED', 'FULL_FEE'].includes(organisation.type) &&
    organisation.subscriptionTier &&
    isOrgManager;
  useSetTitleTag(`${organisation.name || 'Organization'} stats`);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  });

  if (token) {
    return (
      <ReactPlaceholder
        showLoadingAnimation={true}
        rows={26}
        ready={!error && !loading}
        className="pv3 ph2 ph4-ns"
      >
        <div className="w-100 cf pv3 ph2 ph4-ns bg-white blue-dark">
          <img src={organisation.logo} className="w3 dib v-mid mr3" alt={organisation.name} />
          <h3 className="f2 fw6 mv2 ttu barlow-condensed blue-dark dib v-mid">
            {organisation.name}
          </h3>
          <div className="w-100 fl cf">
            <h4 className="f3 fw6 ttu barlow-condensed blue-dark mt0 pt4 mb3">
              <FormattedMessage {...messages.tasksStatistics} />
            </h4>
            <TasksStats
              query={query}
              setQuery={setQuery}
              stats={apiState.stats}
              error={apiState.isError}
              loading={apiState.isLoading}
              retryFn={fetchTasksStatistics}
            />
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
              {showTierInfo ? (
                <FormattedMessage {...messages.tier} />
              ) : (
                <FormattedMessage {...messages.usageLevel} />
              )}
            </h4>
            <ReactPlaceholder showLoadingAnimation={true} rows={5} delay={500} ready={totalStats}>
              {showTierInfo ? (
                <OrganisationTier
                  type={organisation.type}
                  subscriptionTier={organisation.subscriptionTier}
                  completedActions={completedActions}
                />
              ) : (
                <OrganisationUsageLevel
                  orgName={organisation.name}
                  completedActions={completedActions}
                />
              )}
            </ReactPlaceholder>
          </div>
          <div className="w-40-l w-100 fl cf">
            <h4 className="f3 fw6 ttu barlow-condensed blue-dark mt0 pt4 mb2">
              <FormattedMessage {...messages.orgProjectStats} />
            </h4>
            <div className="pa2">
              <OrganisationProjectStats
                projects={orgStats && orgStats.projects}
                orgName={organisation.name}
              />
            </div>
          </div>
        </div>
      </ReactPlaceholder>
    );
  } else {
    return null;
  }
};

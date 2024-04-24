import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import messages from './messages';
import { useTasksStatsQueryParams, useTasksStatsQueryAPI } from '../hooks/UseTasksStatsQueryAPI';
import { useTotalTasksStats } from '../hooks/UseTotalTasksStats';
import { useCurrentYearStats } from '../hooks/UseOrgYearStats';
import { useFetch } from '../hooks/UseFetch';
import { useSetTitleTag } from '../hooks/UseMetaTags';
import { StatsSection } from '../components/teamsAndOrgs/partnersStats';
import { StatsCardContent } from '../components/statsCard';
import { RemainingTasksStats } from '../components/teamsAndOrgs/remainingTasksStats';
import { OrganisationUsageLevel, OrganisationTier } from '../components/teamsAndOrgs/orgUsageLevel';
import { Resources } from '../components/teamsAndOrgs/partnersResourses';
import { Activity } from '../components/teamsAndOrgs/partnersActivity';
import { OrganisationProjectStats } from '../components/teamsAndOrgs/organisationProjectStats';
import data from '../utils/result.json';

export const PartnersStats = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const partner = {
    name: 'Accenture',
    primaryHashtag: '#accenture',
    secondaryHashtag: '#InnovateTogether',
    logo: 'https://s32519.pcdn.co/es/wp-content/uploads/sites/3/2020/08/accenture-logo-672x284px-336x142.png.webp',
    metaLink: 'https://example.com/accenture-meta',
    xLink: 'https://example.com/accenture-x',
    instagramLink: 'https://www.instagram.com/accenture/',
    webpageLink: 'https://www.accenture.com/',
    feedbackLink: 'https://example.com/accenture-feedback',
    statistics: {
      buildings: 1608515,
      changesets: 213855,
      edits: 2384514,
      latest: '2024-04-16T11:33:58Z',
      roads: 42685.663,
      users: 19747,
    },
  };
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
  /* 
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }); */
  return (
    <ReactPlaceholder showLoadingAnimation={true} rows={26} ready={true} className="pv3 ph2 ph4-ns">
      <div style={{ flex: '2 1 100%', textAlign: 'center', backgroundColor:"#F0EFEF" }}>
        <div>
          <h1 className="barlow-condensed ttu f3 mb2 mt2 truncate">{partner.primaryHashtag}</h1>
          <h4 className="ttu blue-grey f6">{partner.secondaryHashtag}</h4>
        </div>

        <div className="w-100 fl cf">
          <h4 className="f3 fw6 ttu barlow-condensed blue-dark mt0 pt4 mb3">
            <FormattedMessage {...messages.tasksStatistics} />
          </h4>
          <StatsSection partner={partner} />
        </div>
        <div className="w-100 fl cf">
          <h4 className="f3 fw6 ttu barlow-condensed blue-dark mt0 pt4 mb3">
            <FormattedMessage {...messages.activity} />
          </h4>
          <Activity partner={partner} />
        </div>
        <div className="w-100 fl cf">
          <h4 className="f3 fw6 ttu barlow-condensed blue-dark mt0 pt4 mb1 mt4">
            <FormattedMessage {...messages.resources} />
          </h4>
          <Resources partner={partner} />
        </div>
      </div>
    </ReactPlaceholder>
  );
};

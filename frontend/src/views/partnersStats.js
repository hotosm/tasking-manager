import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage} from 'react-intl';
import messages from './messages';
import { useTasksStatsQueryParams, useTasksStatsQueryAPI } from '../hooks/UseTasksStatsQueryAPI';
import { useTotalTasksStats } from '../hooks/UseTotalTasksStats';
import { useCurrentYearStats } from '../hooks/UseOrgYearStats';
import { useFetch } from '../hooks/UseFetch';
import { useSetTitleTag } from '../hooks/UseMetaTags';
import { StatsSection } from '../components/teamsAndOrgs/partnersStats';
import { CustomButton } from '../components/button';
import { Resources } from '../components/teamsAndOrgs/partnersResourses';
import { Activity } from '../components/teamsAndOrgs/partnersActivity';
import { CurrentProjects } from '../components/teamsAndOrgs/currentProjects';

export const PartnersStats = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [partner, setPartners] = useState();
  const fetchData = async () => {
    try {
      const response = await fetch('https://stats.now.ohsome.org/api/stats/hashtags/' + id);

      if (response.ok) {
        const jsonData = await response.json();
        setPartners(jsonData.result[id]);
      } else {
        console.error('Error al obtener los datos:', response.statusText);
      }
    } catch (error) {
      console.error('Error al procesar la solicitud:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
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
    <ReactPlaceholder
      showLoadingAnimation={true}
      rows={26}
      ready={partner}
      className="pv3 ph2 ph4-ns"
    >
      <div style={{ flex: '2 1 100%', backgroundColor: '#F0EFEF' }}>
        <div className="w-100 ph4 ph2 pv3 blue-dark flex ">
          <div>
            <h1 className="f2 fw5 mt3 mt2-ns mb3 ttu barlow-condensed blue-dark dib mr3">{id}</h1>
            <span className="ttu blue-grey f6">{partner?.secondaryHashtag}</span>
          </div>

          <div className="flex w-100">
            <StatsSection partner={partner} />
          </div>
        </div>

        <div className="w-100 fl cf">
          <h4 className="ph4 f3 fw6 ttu barlow-condensed blue-dark mt0 pt4 mb3">
            <FormattedMessage {...messages.currentProjects} />
          </h4>
          <div className="w-100 flex">
          <CurrentProjects/>
          <div className="w-25 flex flex-column justify-center items-center ">
          <FormattedMessage {...messages.newToMapping} />
          <a href="/learn/map" className="link base-font f6 mt3 bn pn red pointer">
              <span className="pr2 ttu f6 fw6">
              <FormattedMessage {...messages.learnToMap} />
              </span>
            </a>
          </div>
          </div>
        </div>
        <div className="w-100 fl cf">
          <h4 className="ph4 f3 fw6 ttu barlow-condensed blue-dark mt0 pt4 mb3">
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

import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage } from 'react-intl';
import messages from './messages';
import { NotFound } from './notFound';
import { useFetch } from '../hooks/UseFetch';
import { StatsSection } from '../components/teamsAndOrgs/partnersStats';
import LearnMapNowLogo from '../assets/img/learn-MapNow.svg';
import { Resources } from '../components/teamsAndOrgs/partnersResourses';
import { Activity } from '../components/teamsAndOrgs/partnersActivity';
import { CurrentProjects } from '../components/teamsAndOrgs/currentProjects';
import { Button } from '../components/button';

export const PartnersStats = () => {
  const { id } = useParams();
  const [partnerStats, setPartnerStats] = useState(null);
  const [error, loading, partner] = useFetch(`partners/${id}/`);

  const fetchData = async (name) => {
    try {
      let hashtag = name.trim();
      if (hashtag.startsWith('#')) {
        hashtag = hashtag.slice(1);
      }
      hashtag = hashtag.toLowerCase();
      const response = await fetch('https://stats.now.ohsome.org/api/stats/hashtags/' + hashtag);
      if (response.ok) {
        const jsonData = await response.json();
        if (jsonData.result !== undefined && Object.keys(jsonData.result).length !== 0)
          setPartnerStats(jsonData.result[hashtag]);
      } else {
        console.error('Error al obtener los datos:', response.statusText);
      }
    } catch (error) {
      console.error('Error al procesar la solicitud:', error);
    }
  };

  useEffect(() => {
    if (partner !== undefined && Object.keys(partner).length !== 0) {
      fetchData(partner.primary_hashtag);
    }
  }, [partner]);

  return (
    <ReactPlaceholder
      showLoadingAnimation={true}
      rows={26}
      ready={!loading}
      className="pv3 ph2 ph4-ns"
    >
      {!loading && error ? (
        <NotFound />
      ) : (
        <div style={{ flex: '2 1 100%', backgroundColor: '#F0EFEF', padding: '0px 20px' }}>
          <div className="flex flex-column mt3 mt2-ns mb3 ml4">
            <h1 className="f2 fw5  ttu barlow-condensed blue-dark dib mr3">{partner.name}</h1>
            <span className="ttu blue-grey f6">{partner.primary_hashtag}</span>
          </div>
          <div className="w-100 ph4 pv1 blue-dark flex ">
            <div className="flex w-100">
              <StatsSection partner={partnerStats} />
            </div>
          </div>

          <div className="w-100 fl cf">
            <h4 className="ph4 f3 fw6 ttu barlow-condensed blue-dark mt0 pt4 mb3">
              <FormattedMessage {...messages.currentProjects} />
            </h4>
            <div className="w-100 pt5 pb2 ph6-l ph4 flex justify-around flex-wrap flex-nowrap-ns stats-container ">
              <CurrentProjects currentProjects={partner.current_projects} />
              <div className="w-25 flex flex-column items-center text-center mt2">
                <FormattedMessage {...messages.newToMapping} />
                <img src={LearnMapNowLogo} height="100" alt="" className="mv2" />
                <Link to={`/learn/map/`}>
                  <Button className="bg-red ba b--red white pv2 ph3">
                    <FormattedMessage {...messages.learnToMap} />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="w-80 fl cf">
            <h4 className="ph4 f3 fw6 ttu barlow-condensed blue-dark mt0 pt4 mb3 self-center">
              <FormattedMessage {...messages.resources} />
            </h4>
            <Resources partner={partner} />
          </div>
          <div className="w-100 fl cf">
            <h4 className="ph4 f3 fw6 ttu barlow-condensed blue-dark mt0 pt4 mb3">
              <FormattedMessage {...messages.activity} />
            </h4>
            <Activity partner={partner} />
          </div>
        </div>
      )}
    </ReactPlaceholder>
  );
};

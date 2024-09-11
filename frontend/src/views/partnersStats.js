import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { NotFound } from './notFound';
import { useFetch } from '../hooks/UseFetch';
import { Leaderboard } from '../components/partners/leaderboard';
import { Resources } from '../components/partners/partnersResources';
import { OHSOME_STATS_BASE_URL } from '../config';
import { Button } from '../components/button';
import { TwitterIcon, FacebookIcon, InstagramIcon } from '../components/svgIcons';

const tabData = [{ id: 'leaderboard', title: 'Leaderboard' }];

export const PartnersStats = () => {
  const { id, tabname } = useParams();
  const navigate = useNavigate();
  const [partnerStats, setPartnerStats] = useState(null);
  const [error, loading, partner] = useFetch(`partners/${id}/`);

  // navigate to /leaderboard path when no tab param present
  useEffect(() => {
    if (!tabname) {
      navigate('leaderboard');
    }
  }, [navigate, tabname]);

  const fetchData = async (name) => {
    try {
      let hashtag = name.trim();
      if (hashtag.startsWith('#')) {
        hashtag = hashtag.slice(1);
      }
      hashtag = hashtag.toLowerCase();
      const response = await fetch(OHSOME_STATS_BASE_URL + '/stats/hashtags/' + hashtag);
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

  function getTabContent() {
    switch (tabname) {
      case 'leaderboard':
        return <Leaderboard partner={partner} partnerStats={partnerStats} />;
      default:
        return <></>;
    }
  }

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
        <div className="">
          <div className="flex flex-column bg-blue-dark ph4">
            {/* logo */}
            {partner.logo_url ? (
              <img src={partner.logo_url} alt="logo" height={70} />
            ) : (
              <h3 className="f2 fw6 ttu barlow-condensed white" style={{ marginBottom: '1.75rem' }}>
                {partner.name}
              </h3>
            )}
            <div className="flex justify-between">
              <div className="flex" style={{ gap: '0.75rem' }}>
                {tabData.map(({ id: tabId, title }) => (
                  <div
                    key={tabId}
                    className={`flex items-center pointer ${
                      tabname === tabId ? 'bg-tan blue-dark' : 'bg-grey-dark white'
                    }`}
                    style={{
                      borderRadius: '3px 3px 0px 0px',
                      padding: '0.625rem 1.375rem',
                      fontWeight: '500',
                    }}
                    onClick={() => navigate(`/partners/${id}/stats/${tabId}`)}
                  >
                    <p className="ma0">{title}</p>
                  </div>
                ))}
              </div>
              <div className="flex" style={{ gap: '1.5rem' }}>
                {/* new to mapping button */}
                <Link to={`/learn/map/`}>
                  <Button
                    className="bg-transparent white br1 f5 bn"
                    style={{ padding: '0.75rem 0' }}
                  >
                    <FormattedMessage {...messages.newToMapping} />
                  </Button>
                </Link>

                {/* resources button */}
                <Resources partner={partner} />

                {/* social logos */}
                <div className="flex items-center" style={{ gap: '0.625rem' }}>
                  {!!partner.link_x && (
                    <a
                      href={partner.link_x}
                      className="link barlow-condensed white f4 ttu di-l dib"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <TwitterIcon noBg className="partners-social-icon" />
                    </a>
                  )}
                  {!!partner.link_meta && (
                    <a
                      href={partner.link_meta}
                      className="link barlow-condensed white f4 ttu di-l dib"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FacebookIcon className="partners-social-icon" />
                    </a>
                  )}
                  {!!partner.link_instagram && (
                    <a
                      href={partner.link_instagram}
                      className="link barlow-condensed white f4 ttu di-l dib"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <InstagramIcon className="partners-social-icon" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* tab content */}
          {getTabContent()}
        </div>
      )}
    </ReactPlaceholder>
  );
};

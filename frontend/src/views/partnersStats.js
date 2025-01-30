import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactPlaceholder from 'react-placeholder';

import { NotFound } from './notFound';
import { useFetch } from '../hooks/UseFetch';
import { Leaderboard } from '../components/partners/leaderboard';
import { PartnersMapswipeStats } from './partnersMapswipeStats';
import { Resources } from '../components/partners/partnersResources';
import { OHSOME_STATS_API_URL } from '../config';
import { TwitterIcon, FacebookIcon, InstagramIcon } from '../components/svgIcons';

function getSocialIcons(link) {
  const socialName = link.split('_')?.[1];
  switch (socialName) {
    case 'x':
      return <TwitterIcon noBg className="partners-social-icon" />;
    case 'meta':
      return <FacebookIcon className="partners-social-icon" />;
    case 'instagram':
      return <InstagramIcon className="partners-social-icon" />;
    default:
      return <></>;
  }
}

const tabData = [
  { id: 'leaderboard', title: 'Tasking Manager' },
  { id: 'mapswipe', title: 'Map Swipe' },
];

export const PartnersStats = () => {
  const { id, tabname } = useParams();
  const navigate = useNavigate();
  const [partnerStats, setPartnerStats] = useState(null);
  const [error, loading, partner] = useFetch(`partners/${id}/`);

  const fetchData = async (name) => {
    try {
      let hashtag = name.trim();
      if (hashtag.startsWith('#')) {
        hashtag = hashtag.slice(1);
      }
      hashtag = hashtag.toLowerCase();
      const response = await fetch(OHSOME_STATS_API_URL + '/stats/hashtags/' + hashtag);
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
      case 'mapswipe':
        return <PartnersMapswipeStats />;
      default:
        return <Leaderboard partner={partner} partnerStats={partnerStats} />;
    }
  }

  const socialLinks = Object.keys(partner)
    .filter((key) => key.startsWith('link'))
    .filter((link) => partner[link]);

  // remove Map Swipe tab if mapswipe_group_id not present
  const modifiedTabData = !partner?.mapswipe_group_id
    ? tabData.filter((tab) => tab.id !== 'mapswipe')
    : tabData;

  const activeTab = tabname === 'mapswipe' ? 'mapswipe' : 'leaderboard';

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
              <div className="partners-banner-logo">
                <img src={partner.logo_url} alt="logo" height={70} />
              </div>
            ) : (
              <h3 className="f2 fw6 ttu barlow-condensed white" style={{ marginBottom: '1.75rem' }}>
                {partner.name}
              </h3>
            )}
            <div className="flex justify-between">
              <div className="flex gap-0.75">
                {modifiedTabData.map(({ id: tabId, title }) => (
                  <div
                    key={tabId}
                    role="button"
                    tabIndex={0}
                    className={`flex items-center pointer partners-tab-item ${
                      activeTab === tabId ? 'bg-tan blue-dark' : 'bg-grey-dark white'
                    }`}
                    onClick={() =>
                      tabId === 'leaderboard'
                        ? navigate(`/partners/${id}/stats`)
                        : navigate(`/partners/${id}/stats/${tabId}`)
                    }
                    onKeyDown={() => {}}
                  >
                    <p className="ma0">{title}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5">
                {/* resources button */}
                <Resources partner={partner} />

                {/* social logos */}
                {!!socialLinks.length && (
                  <div className="flex items-center gap-0.625">
                    {socialLinks.map((link) => (
                      <a
                        key={link}
                        href={partner[link]}
                        className="link barlow-condensed white f4 ttu di-l dib"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {getSocialIcons(link)}
                      </a>
                    ))}
                  </div>
                )}
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

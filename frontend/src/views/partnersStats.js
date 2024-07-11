import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { NotFound } from './notFound';
import { useFetch } from '../hooks/UseFetch';
import { StatsSection } from '../components/partners/partnersStats';
import { Activity } from '../components/partners/partnersActivity';
import { CurrentProjects } from '../components/partners/currentProjects';
import { Resources } from '../components/partners/partnersResources';
import { OHSOME_STATS_BASE_URL } from '../config';
import { Button } from '../components/button';
import { TwitterIcon, FacebookIcon, InstagramIcon } from '../components/svgIcons';

const socialIconsStyle = { height: '24px', width: '24px' };

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
          <div className="flex items-center justify-between bg-blue-dark pa4">
            {/* logo */}
            <img src={partner.logo_url} alt="logo" height={70} />
            <Link to={`/learn/map/`}>
              <Button className="bg-grey-dark white mr3 br1 f5 bn">
                <FormattedMessage {...messages.newToMapping} />
              </Button>
            </Link>
          </div>
          {/* social logos */}
          <div className="pa4 bg-tan flex flex-column" style={{ gap: '1.25rem' }}>
            <div className="flex justify-between items-center">
              <h3 class="f2 blue-dark fw7 ma0 barlow-condensed v-mid dib">
                {partner.primary_hashtag
                  ?.split(',')
                  ?.map((str) => `#${str}`)
                  ?.join(', ')}
              </h3>
              <div className="flex" style={{ gap: '0.5rem' }}>
                {!!partner.link_x && (
                  <a
                    href={partner.link_x}
                    className="link barlow-condensed white f4 ttu di-l dib"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <TwitterIcon className="blue-dark" style={socialIconsStyle} />
                  </a>
                )}
                {!!partner.link_meta && (
                  <a
                    href={partner.link_meta}
                    className="link barlow-condensed white f4 ttu di-l dib"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FacebookIcon className="blue-dark" style={socialIconsStyle} />
                  </a>
                )}
                {!!partner.link_instagram && (
                  <a
                    href={partner.link_instagram}
                    className="link barlow-condensed white f4 ttu di-l dib"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <InstagramIcon className="blue-dark" style={socialIconsStyle} />
                  </a>
                )}
              </div>
            </div>

            <StatsSection partner={partnerStats} />

            <CurrentProjects currentProjects={partner.current_projects} />

            {/* resources section */}
            {Object.keys(partner).some((key) => key.includes('name_')) && (
              <div className="w-100 fl cf">
                <h3 className="f2 fw6 ttu barlow-condensed blue-dark mt0 pt4 mb3">
                  <FormattedMessage {...messages.resources} />
                </h3>
                <Resources partner={partner} />
              </div>
            )}

            {/* activity section */}
            <div className="w-100 fl cf">
              <h3 className="f2 fw6 ttu barlow-condensed blue-dark mt0 pt4 mb3">
                <FormattedMessage {...messages.activity} />
              </h3>
              <Activity partner={partner} />
            </div>
          </div>
        </div>
      )}
    </ReactPlaceholder>
  );
};

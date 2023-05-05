import React, { useEffect, useState } from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import axios from 'axios';
import shortNumber from 'short-number';

import messages from './messages';
import { HOMEPAGE_STATS_API_URL } from '../../config';
import { fetchLocalJSONAPIWithAbort } from '../../network/genericJSONRequest';

export const StatsNumber = (props) => {
  const value = shortNumber(props.value);
  if (typeof value === 'number') {
    return <FormattedNumber value={value} />;
  }
  return (
    <span>
      <FormattedNumber value={Number(value.substr(0, value.length - 1))} />
      {value.substr(-1)}
    </span>
  );
};

export const StatsColumn = ({ label, value }: Object) => {
  return (
    <div className={`tc`}>
      <div className="fw5 red barlow-condensed stat-number">
        {value !== undefined ? <StatsNumber value={value} /> : <>&#8211;</>}
      </div>
      <div className="db blue-grey f6 fw7">
        <FormattedMessage {...label} />
      </div>
    </div>
  );
};

export const StatsSection = () => {
  const [osmStats, setOsmStats] = useState({});
  const [tmStats, setTmStats] = useState({});

  useEffect(() => {
    const abortController = new AbortController();
    // Using axios over the useFetch hook for external API endpoint
    const fetchOsmStats = () =>
      axios.get(HOMEPAGE_STATS_API_URL, {
        signal: abortController.signal,
      });

    const fetchSystemStats = () =>
      fetchLocalJSONAPIWithAbort('system/statistics/', null, abortController.signal);

    Promise.all([fetchOsmStats(), fetchSystemStats()])
      .then(([osmStats, tmStats]) => {
        const { edits, building_count_add: buildings, road_km_add: roads } = osmStats.data;
        setOsmStats({
          edits,
          buildings,
          roads,
        });
        setTmStats(tmStats);
      })
      .catch((err) => console.error(err));
    return () => {
      abortController.abort();
    };
  }, []);

  return (
    <div className="pt5 pb2 ph6-l ph4 flex justify-around flex-wrap flex-nowrap-ns stats-container">
      <StatsColumn label={messages.buildingsStats} value={osmStats?.buildings} />
      <StatsColumn label={messages.roadsStats} value={osmStats?.roads} />
      <StatsColumn label={messages.editsStats} value={osmStats?.edits} />
      <StatsColumn label={messages.communityStats} value={tmStats?.totalMappers} />
      <StatsColumn label={messages.mappersStats} value={tmStats?.mappersOnline} />
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import axios from 'axios';
import shortNumber from 'short-number';

import messages from './messages';
import { HOMEPAGE_STATS_API_URL } from '../../config';
import { useFetch } from '../../hooks/UseFetch';

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
        <StatsNumber value={value} />
      </div>
      <div className="db blue-grey f6 fw7">
        <FormattedMessage {...label} />
      </div>
    </div>
  );
};

export const StatsSection = () => {
  /* eslint-disable-next-line */
  const [tmStatsError, tmStatsLoading, tmStats] = useFetch('system/statistics/');
  const [stats, setStats] = useState({ edits: 0, buildings: 0, roads: 0 });

  useEffect(() => {
    // Using axios over the useFetch hook for external API endpoint
    const abortController = new AbortController();
    axios
      .get(HOMEPAGE_STATS_API_URL, {
        signal: abortController.signal,
      })
      .then((res) => {
        const { edits, building_count_add: buildings, road_km_add: roads } = res.data;
        setStats({
          edits,
          buildings,
          roads,
        });
      })
      .catch((err) => console.error(err));
    return () => {
      abortController.abort();
    };
  }, []);

  return (
    <div className="pt5 pb2 ph6-l ph4 flex justify-around flex-wrap flex-nowrap-ns stats-container">
      <StatsColumn label={messages.buildingsStats} value={stats.buildings} />
      <StatsColumn label={messages.roadsStats} value={stats.roads} />
      <StatsColumn label={messages.editsStats} value={stats.edits} />
      <StatsColumn label={messages.communityStats} value={tmStats.totalMappers || 0} />
      <StatsColumn label={messages.mappersStats} value={tmStats.mappersOnline || 0} />
    </div>
  );
};

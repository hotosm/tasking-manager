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
    <div className={`fl tc w-20-l w-third-m w-100 dib h4`}>
      <div className="db f1 fw8 red barlow-condensed">
        <StatsNumber value={value} />
      </div>
      <div className="db blue-grey">
        <FormattedMessage {...label} />
      </div>
    </div>
  );
};

export const StatsSection = () => {
  /* eslint-disable-next-line */
  const [tmStatsError, tmStatsLoading, tmStats] = useFetch('system/statistics/');
  const [stats, setStats] = useState({ edits: 0, buildings: 0, roads: 0 });
  const url = HOMEPAGE_STATS_API_URL;
  const getStats = async (url) => {
    try {
      const response = await axios.get(url);
      setStats({
        edits: response.data.edits,
        buildings: response.data.building_count_add,
        roads: response.data.road_km_add,
      });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getStats(url);
  }, [url]);

  return (
    <div className="cf pt5 pb2 ph5-l ph4 bg-white">
      <StatsColumn label={messages.buildingsStats} value={stats.buildings} />
      <StatsColumn label={messages.roadsStats} value={stats.roads} />
      <StatsColumn label={messages.editsStats} value={stats.edits} />
      <StatsColumn label={messages.communityStats} value={tmStats.totalMappers || 0} />
      <StatsColumn label={messages.mappersStats} value={tmStats.mappersOnline || 0} />
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FormattedMessage } from 'react-intl';

import userDetailMessages from '../userDetail/messages';
import { HOMEPAGE_STATS_API_URL } from '../../config';
import { RoadIcon, HomeIcon, WavesIcon, MarkerIcon } from '../svgIcons';
import { StatsCard } from '../statsCard';

export const FeatureStats = () => {
  const [stats, setStats] = useState({ edits: 0, buildings: 0, roads: 0, pois: 0, waterways: 0 });
  const getStats = async () => {
    try {
      const response = await axios.get(HOMEPAGE_STATS_API_URL);
      setStats({
        edits: response.data.edits,
        buildings: response.data.building_count_add,
        roads: response.data.road_km_add,
        pois: response.data.poi_count_add,
        waterways: response.data.waterway_km_add,
      });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getStats();
  }, []);

  const iconClass = 'h-50 w-50';
  const iconStyle = { height: '45px' };

  return (
    <div className="w-100 cf">
      <StatsCard
        icon={<HomeIcon className={iconClass} style={iconStyle} />}
        description={<FormattedMessage {...userDetailMessages.buildingsMapped} />}
        value={stats.buildings || 0}
        className={'w-25-l w-50-m w-100 mv1'}
      />
      <StatsCard
        icon={<RoadIcon className={iconClass} style={iconStyle} />}
        description={<FormattedMessage {...userDetailMessages.roadMapped} />}
        value={stats.roads || 0}
        className={'w-25-l w-50-m w-100 mv1'}
      />
      <StatsCard
        icon={<MarkerIcon className={iconClass} style={iconStyle} />}
        description={<FormattedMessage {...userDetailMessages.poiMapped} />}
        value={stats.pois || 0}
        className={'w-25-l w-50-m w-100 mv1'}
      />
      <StatsCard
        icon={<WavesIcon className={iconClass} style={iconStyle} />}
        description={<FormattedMessage {...userDetailMessages.waterwaysMapped} />}
        value={stats.waterways || 0}
        className={'w-25-l w-50-m w-100 mv1'}
      />
    </div>
  );
};

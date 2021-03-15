import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { HOMEPAGE_STATS_API_URL } from '../../config';
import { RoadIcon, HomeIcon, WavesIcon, MarkerIcon } from '../svgIcons';
import { StatsCard } from '../statsCardContent';

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
        field={'buildings'}
        icon={<HomeIcon className={iconClass} style={iconStyle} />}
        description={<FormattedMessage {...messages.buildingsMapped} />}
        value={stats.buildings || 0}
        className={'w-25-ns w-100 w-50-m'}
      />
      <StatsCard
        field={'road'}
        icon={<RoadIcon className={iconClass} style={iconStyle} />}
        description={<FormattedMessage {...messages.roadMapped} />}
        value={stats.roads || 0}
        className={'w-25-ns w-100 w-50-m'}
      />
      <StatsCard
        field={'poi'}
        icon={<MarkerIcon className={iconClass} style={iconStyle} />}
        description={<FormattedMessage {...messages.poiMapped} />}
        value={stats.pois || 0}
        className={'w-25-ns w-100 w-50-m'}
      />
      <StatsCard
        field={'waterways'}
        icon={<WavesIcon className={iconClass} style={iconStyle} />}
        description={<FormattedMessage {...messages.waterwaysMapped} />}
        value={stats.waterways || 0}
        className={'w-25-ns w-100 w-50-m'}
      />
    </div>
  );
};

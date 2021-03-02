import React, { useEffect, useState } from 'react';
import axios from 'axios';

import { HOMEPAGE_STATS_API_URL } from '../../config';
import { Element } from '../userDetail/elementsMapped';

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

  return (
    <div className="w-100 cf">
      <Element field={'buildings'} value={stats.buildings || 0} />
      <Element field={'road'} value={stats.roads || 0} />
      <Element field={'poi'} value={stats.pois || 0} />
      <Element field={'waterways'} value={stats.waterways || 0} />
    </div>
  );
};

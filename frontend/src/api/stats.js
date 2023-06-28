import { useQuery } from '@tanstack/react-query';

import api from './apiClient';
import { HOMEPAGE_STATS_API_URL } from '../config';

export const useSystemStatisticsQuery = () => {
  const fetchSystemStats = ({ signal }) => {
    return api().get(`system/statistics/`, {
      signal,
    });
  };

  return useQuery({
    queryKey: ['tm-stats'],
    queryFn: fetchSystemStats,
    useErrorBoundary: true,
  });
};

export const useOsmStatsQuery = () => {
  const fetchOsmStats = ({ signal }) => {
    return api().get(HOMEPAGE_STATS_API_URL, {
      signal,
    });
  };

  return useQuery({
    queryKey: ['osm-stats'],
    queryFn: fetchOsmStats,
    useErrorBoundary: true,
  });
};

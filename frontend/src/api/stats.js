import { useQuery } from '@tanstack/react-query';

import api from './apiClient';
import { OHSOME_STATS_BASE_URL } from '../config';

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

export const useProjectStatisticsQuery = (projectId) => {
  const fetchProjectStats = ({ signal }) => {
    return api().get(`projects/${projectId}/statistics/`, {
      signal,
    });
  };

  return useQuery({
    queryKey: ['project-stats'],
    queryFn: fetchProjectStats,
    select: (data) => data.data,
  });
};

export const useOsmStatsQuery = () => {
  const fetchOsmStats = ({ signal }) => {
    return api().get(`${OHSOME_STATS_BASE_URL}/stats/hotosm-project-%2A`, {
      signal,
    });
  };

  return useQuery({
    queryKey: ['osm-stats'],
    queryFn: fetchOsmStats,
    useErrorBoundary: true,
    select: (data) => data.data.result
  });
};

export const useOsmHashtagStatsQuery = (defaultComment) => {
  const fetchOsmStats = ({ signal }) => {
    return api().get(`${OHSOME_STATS_BASE_URL}/stats/${defaultComment[0].replace('#', '')}`, {
      signal,
    });
  };

  return useQuery({
    queryKey: ['osm-hashtag-stats'],
    queryFn: fetchOsmStats,
    useErrorBoundary: true,
    enabled: Boolean(defaultComment?.[0]),
    select: (data) => data.data.result,
  });
};

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

export const useOsmHashtagStatsQuery = (defaultComment) => {
  const fetchOsmStats = ({ signal }) => {
    return api().get(
      `https://osm-stats-production-api.azurewebsites.net/stats/${defaultComment[0].replace(
        '#',
        '',
      )}`,
      {
        signal,
      },
    );
  };

  return useQuery({
    queryKey: ['osm-hashtag-stats'],
    queryFn: fetchOsmStats,
    useErrorBoundary: true,
    enabled: Boolean(defaultComment?.[0]),
    select: (data) => data.data,
  });
};

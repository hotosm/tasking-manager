import { useQuery } from '@tanstack/react-query';

import { fetchExternalJSONAPI } from '../network/genericJSONRequest';
import api from './apiClient';
import { OHSOME_STATS_API_URL, defaultChangesetComment } from '../config';

const ohsomeProxyAPI = (userId, topics) => {
  const token = localStorage.getItem('token');
  return api(token).get(`users/statistics/ohsome/?userId=${userId}&topics=${topics}`);
};

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

export const useOsmStatsQuery = ({ topics = [] }) => {
  // Converts the 'topics' array into a query string like '&topics=building&topics=road'
  const topicQueryParams = topics?.reduce((acc, curr) => `${acc}&topics=${curr}`, '');

  const fetchOsmStats = ({ signal }) => {
    return api().get(
      `${OHSOME_STATS_API_URL}/stats?hashtag=${defaultChangesetComment}-%2A${topicQueryParams}`,
      {
        signal,
      },
    );
  };

  return useQuery({
    queryKey: ['osm-stats'],
    queryFn: fetchOsmStats,
    useErrorBoundary: true,
    select: (data) => data.data.result,
  });
};

export const useOsmHashtagStatsQuery = (defaultComment) => {
  const fetchOsmStats = ({ signal }) => {
    return api().get(`${OHSOME_STATS_API_URL}/stats/${defaultComment[0].replace('#', '')}`, {
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

export const useUserOsmStatsQuery = (id) => {
  const fetchUserOsmStats = () => {
    return ohsomeProxyAPI(id, 'poi,highway,building,waterway');
  };

  return useQuery({
    queryKey: ['user-osm-stats'],
    queryFn: fetchUserOsmStats,
    // userDetail.test.js fails on CI when useErrorBoundary=true
    useErrorBoundary: process.env.NODE_ENV !== 'test',
    select: (data) => data.data.result,
    enabled: !!id,
  });
};

export const useOsmStatsMetadataQuery = () => {
  const fetchOsmStatsMetadata = () => {
    return fetchExternalJSONAPI(`${OHSOME_STATS_API_URL}/metadata`);
  };

  return useQuery({
    queryKey: ['osm-stats-metadata'],
    queryFn: fetchOsmStatsMetadata,
    useErrorBoundary: true,
    select: (data) => data.result,
  });
};

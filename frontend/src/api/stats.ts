import { useQuery } from '@tanstack/react-query';

import { fetchExternalJSONAPI } from '../network/genericJSONRequest';
import api from './apiClient';
import { OHSOME_STATS_BASE_URL, defaultChangesetComment } from '../config';

const ohsomeProxyAPI = (url: string) => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  return api(token).get(`users/statistics/ohsome/?url=${url}`);
};

export const useSystemStatisticsQuery = () => {
  const fetchSystemStats = ({ signal }: {
    signal: AbortSignal;
  }) => {
    return api().get(`system/statistics/`, {
      signal,
    });
  };

  return useQuery({
    queryKey: ['tm-stats'],
    queryFn: fetchSystemStats,
    throwOnError: true,
  });
};

export const useProjectStatisticsQuery = (projectId: string) => {
  const fetchProjectStats = ({ signal }: {
    signal: AbortSignal;
  }) => {
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
  const fetchOsmStats = ({ signal }: {
    signal: AbortSignal;
  }) => {
    return api().get(`${OHSOME_STATS_BASE_URL}/stats/${defaultChangesetComment}-%2A`, {
      signal,
    });
  };

  return useQuery({
    queryKey: ['osm-stats'],
    queryFn: fetchOsmStats,
    throwOnError: true,
    select: (data) => data.data.result,
  });
};

export const useOsmHashtagStatsQuery = (defaultComment: string) => {
  const fetchOsmStats = ({ signal }: {
    signal: AbortSignal;
  }) => {
    return api().get(`${OHSOME_STATS_BASE_URL}/stats/${defaultComment[0].replace('#', '')}`, {
      signal,
    });
  };

  return useQuery({
    queryKey: ['osm-hashtag-stats'],
    queryFn: fetchOsmStats,
    throwOnError: true,
    enabled: Boolean(defaultComment?.[0]),
    select: (data) => data.data.result,
  });
};

export const useUserOsmStatsQuery = (id: string) => {
  const fetchUserOsmStats = () => {
    return ohsomeProxyAPI(
      `${OHSOME_STATS_BASE_URL}/topic/poi,highway,building,waterway/user?userId=${id}`,
    );
  };

  return useQuery({
    queryKey: ['user-osm-stats'],
    queryFn: fetchUserOsmStats,
    // userDetail.test.js fails on CI when throwOnError=true
    throwOnError: import.meta.env.NODE_ENV !== 'test',
    select: (data) => data?.data.result,
    enabled: !!id,
  });
};

export const useOsmStatsMetadataQuery = () => {
  const fetchOsmStatsMetadata = () => {
    return fetchExternalJSONAPI(`${OHSOME_STATS_BASE_URL}/metadata`);
  };

  return useQuery({
    queryKey: ['osm-stats-metadata'],
    queryFn: fetchOsmStatsMetadata,
    throwOnError: true,
    select: (data) => data.result,
  });
};

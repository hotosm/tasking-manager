import axios from 'axios';
import { subMonths, format } from 'date-fns';
import { QueryKey, QueryOptions, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { remapParamsToAPI } from '../utils/remapParamsToAPI';
import api from './apiClient';
import { API_URL, UNDERPASS_URL } from '../config';
import { RootStore } from '../store';

export const useProjectsQuery = (
  fullProjectsQuery: string,
  action: string,
  queryOptions: QueryOptions,
) => {
  const token = useSelector((state: RootStore) => state.auth.token);
  const locale = useSelector((state: RootStore) => state.preferences['locale']);

  const fetchProjects = async (signal: AbortSignal | undefined, queryKey: QueryKey) => {
    const [, fullProjectsQuery, action] = queryKey;
    const paramsRemapped = remapParamsToAPI(fullProjectsQuery, backendToQueryConversion);
    // it's needed in order to query by action when the user goes to /explore page
    if (paramsRemapped.action === undefined && action) {
      paramsRemapped.action = action;
    }

    if (paramsRemapped.lastUpdatedTo) {
      paramsRemapped.lastUpdatedTo = format(subMonths(Date.now(), 6), 'yyyy-MM-dd');
    }

    return await api(token, locale)
      .get('projects/', {
        signal,
        params: paramsRemapped,
      })
      .then((res) => res.data);
  };

  return useQuery({
    queryKey: ['projects', fullProjectsQuery, action],
    queryFn: ({ signal, queryKey }) => fetchProjects(signal, queryKey),
    placeholderData: (prevData) => prevData,
    ...queryOptions,
  });
};

export const useProjectQuery = (projectId: string, otherOptions: any) => {
  const token = useSelector((state: RootStore) => state.auth.token);
  const locale = useSelector((state: RootStore) => state.preferences['locale']);
  const fetchProject = ({ signal }: { signal: AbortSignal }) => {
    return api(token, locale).get(`projects/${projectId}/`, {
      signal,
    });
  };

  return useQuery({
    queryKey: ['project', projectId],
    queryFn: fetchProject,
    ...otherOptions,
  });
};

type ProjectSummaryQueryOptions = Omit<UseQueryOptions<any>, ('queryKey' | 'queryFn' | 'select')>;

export const useProjectSummaryQuery = (projectId: string, otherOptions?: ProjectSummaryQueryOptions) => {
  const token = useSelector((state: RootStore) => state.auth.token);
  const locale = useSelector((state: RootStore) => state.preferences['locale']);

  const fetchProjectSummary = ({ signal }: { signal: AbortSignal }) => {
    return api(token, locale).get(`projects/${projectId}/queries/summary/`, {
      signal,
    });
  };

  return useQuery({
    queryKey: ['project-summary', projectId],
    queryFn: fetchProjectSummary,
    select: (data: any) => data.data,
    ...otherOptions,
  });
};

export const useProjectContributionsQuery = (projectId: string, otherOptions = {}) => {
  const fetchProjectContributions = ({ signal }: { signal: AbortSignal }) => {
    return api().get(`projects/${projectId}/contributions/`, {
      signal,
    });
  };

  return useQuery({
    queryKey: ['project-contributions', projectId],
    queryFn: fetchProjectContributions,
    select: (data) => data.data.userContributions,
    ...otherOptions,
  });
};

export const useActivitiesQuery = (projectId: string) => {
  const ACTIVITIES_REFETCH_INTERVAL = 1000 * 60;
  const fetchProjectActivities = ({ signal }: { signal: AbortSignal }) => {
    return api().get(`projects/${projectId}/activities/latest/`, {
      signal,
    });
  };

  return useQuery({
    queryKey: ['project-activities', projectId],
    queryFn: fetchProjectActivities,
    select: (data) => data.data,
    refetchIntervalInBackground: false,
    refetchInterval: ACTIVITIES_REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
    throwOnError: true,
  });
};

export const useTasksQuery = (projectId: string, otherOptions = {}) => {
  const fetchProjectTasks = ({ signal }: { signal: AbortSignal }) => {
    return api().get(`projects/${projectId}/tasks/`, {
      signal,
    });
  };

  return useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: fetchProjectTasks,
    select: (data) => data.data,
    ...otherOptions,
  });
};

export const usePriorityAreasQuery = (projectId: string) => {
  const fetchProjectPriorityArea = (signal: { signal: AbortSignal }) => {
    return api().get(`projects/${projectId}/queries/priority-areas/`, {
      signal,
    });
  };

  return useQuery({
    queryKey: ['project-priority-area', projectId],
    queryFn: ({ signal }) => fetchProjectPriorityArea(signal),
    select: (data) => data.data,
  });
};

export const useProjectTimelineQuery = (projectId: string) => {
  const fetchTimelineData = (signal: { signal: AbortSignal }) => {
    return api().get(`projects/${projectId}/contributions/queries/day/`, {
      signal,
    });
  };

  return useQuery({
    queryKey: ['project-timeline', projectId],
    queryFn: ({ signal }) => fetchTimelineData(signal),
    select: (data) => data.data.stats,
  });
};

export const useTaskDetail = (projectId: string, taskId: number, shouldRefetch: boolean) => {
  const token = useSelector((state: RootStore) => state.auth.token);

  const fetchTaskDetail = ({ signal }: { signal: AbortSignal }) => {
    return api(token).get(`projects/${projectId}/tasks/${taskId}/`, {
      signal,
    });
  };

  return useQuery({
    queryKey: ['task-detail', projectId, taskId],
    queryFn: fetchTaskDetail,
    select: (data) => data.data,
    enabled: !!(projectId && taskId),
    refetchInterval: shouldRefetch ? 1000 * 60 : false,
  });
};

// MAPPING
export const stopMapping = (
  projectId: string,
  taskId: number,
  comment: string,
  token: string,
  locale: string = 'en',
) => {
  return api(token, locale).post(`projects/${projectId}/tasks/actions/stop-mapping/${taskId}/`, {
    comment,
  });
};

export const splitTask = (
  projectId: string,
  taskId: number,
  token: string,
  locale: string = 'en',
) => {
  return api(token, locale).post(`projects/${projectId}/tasks/actions/split/${taskId}/`);
};

export const submitMappingTask = (
  url: string,
  payload: any,
  token: string,
  locale: string = 'en',
) => {
  return api(token, locale).post(url, payload);
};

// VALIDATION
export const stopValidation = (
  projectId: string,
  payload: any,
  token: string,
  locale: string = 'en',
) => {
  return api(token, locale).post(`projects/${projectId}/tasks/actions/stop-validation/`, payload);
};

export const submitValidationTask = (
  projectId: string,
  payload: any,
  token: string,
  locale: string = 'en',
) => {
  return api(token, locale).post(
    `projects/${projectId}/tasks/actions/unlock-after-validation/`,
    payload,
  );
};

export const downloadAsCSV = (allQueryParams, action, token) => {
  const paramsRemapped = remapParamsToAPI(allQueryParams, backendToQueryConversion);
  // it's needed in order to query by action
  if (paramsRemapped.action === undefined && action) {
    paramsRemapped.action = action;
  }

  if (paramsRemapped.lastUpdatedTo) {
    paramsRemapped.lastUpdatedTo = format(subMonths(Date.now(), 6), 'yyyy-MM-dd');
  }
  return api(token).get('projects/', {
    params: paramsRemapped,
  });
};

export const useAvailableCountriesQuery = () => {
  const fetchGeojsonData = () => {
    return axios.get(`${UNDERPASS_URL}/availability`);
  };

  return useQuery({
    queryKey: ['priority-geojson'],
    queryFn: fetchGeojsonData,
    select: (res) => res.data,
  });
};

export const useAllPartnersQuery = (token: string, userId: string) => {
  const fetchAllPartners = () => {
    return api(token).get('partners/');
  };

  return useQuery({
    queryKey: ['all-partners', userId],
    queryFn: fetchAllPartners,
    select: (response) => response.data,
  });
};

const backendToQueryConversion = {
  difficulty: 'difficulty',
  campaign: 'campaign',
  team: 'teamId',
  organisation: 'organisationName',
  location: 'country',
  types: 'mappingTypes',
  exactTypes: 'mappingTypesExact',
  interests: 'interests',
  text: 'textSearch',
  page: 'page',
  orderBy: 'orderBy',
  orderByType: 'orderByType',
  createdByMe: 'createdByMe',
  managedByMe: 'managedByMe',
  favoritedByMe: 'favoritedByMe',
  mappedByMe: 'mappedByMe',
  status: 'projectStatuses',
  action: 'action',
  stale: 'lastUpdatedTo',
  createdFrom: 'createdFrom',
  basedOnMyInterests: 'basedOnMyInterests',
  partnerId: 'partnerId',
  partnershipFrom: 'partnershipFrom',
  partnershipTo: 'partnershipTo',
};

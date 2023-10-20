import { subMonths, format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { remapParamsToAPI } from '../utils/remapParamsToAPI';
import api from './apiClient';

export const useProjectsQuery = (fullProjectsQuery, action) => {
  const token = useSelector((state) => state.auth.token);
  const locale = useSelector((state) => state.preferences['locale']);

  const fetchProjects = (signal, queryKey) => {
    const [, fullProjectsQuery, action] = queryKey;
    const paramsRemapped = remapParamsToAPI(fullProjectsQuery, backendToQueryConversion);
    // it's needed in order to query by action when the user goes to /explore page
    if (paramsRemapped.action === undefined && action) {
      paramsRemapped.action = action;
    }

    if (paramsRemapped.lastUpdatedTo) {
      paramsRemapped.lastUpdatedTo = format(subMonths(Date.now(), 6), 'yyyy-MM-dd');
    }

    return api(token, locale)
      .get('projects/', {
        signal,
        params: paramsRemapped,
      })
      .then((res) => res.data);
  };

  return useQuery({
    queryKey: ['projects', fullProjectsQuery, action],
    queryFn: ({ signal, queryKey }) => fetchProjects(signal, queryKey),
    keepPreviousData: true,
  });
};

export const useProjectQuery = (projectId) => {
  const token = useSelector((state) => state.auth.token);
  const locale = useSelector((state) => state.preferences['locale']);
  const fetchProject = ({ signal }) => {
    return api(token, locale).get(`projects/${projectId}/`, {
      signal,
    });
  };

  return useQuery({
    queryKey: ['project', projectId],
    queryFn: fetchProject,
  });
};
export const useProjectSummaryQuery = (projectId, otherOptions = {}) => {
  const fetchProjectSummary = ({ signal }) => {
    return api().get(`projects/${projectId}/queries/summary/`, {
      signal,
    });
  };

  return useQuery({
    queryKey: ['project-summary', projectId],
    queryFn: fetchProjectSummary,
    select: (data) => data.data,
    ...otherOptions,
  });
};

export const useProjectContributionsQuery = (projectId, otherOptions = {}) => {
  const fetchProjectContributions = ({ signal }) => {
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

export const useActivitiesQuery = (projectId) => {
  const ACTIVITIES_REFETCH_INTERVAL = 1000 * 60;
  const fetchProjectActivities = ({ signal }) => {
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
    useErrorBoundary: true,
  });
};

export const useTasksQuery = (projectId, otherOptions = {}) => {
  const fetchProjectTasks = ({ signal }) => {
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

export const usePriorityAreasQuery = (projectId) => {
  const fetchProjectPriorityArea = (signal) => {
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

export const useProjectTimelineQuery = (projectId) => {
  const fetchTimelineData = (signal) => {
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

export const useTaskDetail = (projectId, taskId, shouldRefetch) => {
  const token = useSelector((state) => state.auth.token);

  const fetchTaskDetail = ({ signal }) => {
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
export const stopMapping = (projectId, taskId, comment, token, locale = 'en') => {
  return api(token, locale).post(`projects/${projectId}/tasks/actions/stop-mapping/${taskId}/`, {
    comment,
  });
};

export const splitTask = (projectId, taskId, token, locale) => {
  return api(token, locale).post(`projects/${projectId}/tasks/actions/split/${taskId}/`);
};

export const submitMappingTask = (url, payload, token, locale) => {
  return api(token, locale).post(url, payload);
};

// VALIDATION
export const stopValidation = (projectId, payload, token, locale = 'en') => {
  return api(token, locale).post(`projects/${projectId}/tasks/actions/stop-validation/`, payload);
};

export const submitValidationTask = (projectId, payload, token, locale) => {
  return api(token, locale).post(
    `projects/${projectId}/tasks/actions/unlock-after-validation/`,
    payload,
  );
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
};

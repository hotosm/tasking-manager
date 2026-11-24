import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';

import api from './apiClient';

export const useLockedTasksQuery = () => {
  const token = useSelector((state) => state.auth.token);
  const locale = useSelector((state) => state.preferences['locale']);

  const fetchLockedTasks = ({ signal }) => {
    return api(token, locale).get(`users/queries/tasks/locked/details/`, {
      signal,
    });
  };

  return useQuery({
    queryKey: ['locked-tasks'],
    queryFn: fetchLockedTasks,
    select: (data) => data.data?.tasks,
    cacheTime: 0,
    useErrorBoundary: true,
  });
};

export const useAssignedTasksQuery = (params = {}, otherOptions = {}) => {
  const token = useSelector((state) => state.auth.token);
  const locale = useSelector((state) => state.preferences['locale']);

  const fetchAssignedTasks = ({ signal, queryKey }) => {
    const [, queryParams] = queryKey;
    return api(token, locale).get(`users/queries/tasks/assigned/`, {
      signal,
      params: queryParams,
    });
  };

  return useQuery({
    queryKey: ['assigned-tasks', params],
    queryFn: fetchAssignedTasks,
    select: (data) => data.data,
    keepPreviousData: true,
    enabled: !!token,
    ...otherOptions,
  });
};

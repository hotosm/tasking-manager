import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';

import api from './apiClient';
import { RootStore } from '../store';

export const useLockedTasksQuery = () => {
  const token = useSelector((state: RootStore) => state.auth.token);
  const locale = useSelector((state: RootStore) => state.preferences['locale']);

  const fetchLockedTasks = ({ signal }: {
    signal: AbortSignal;
  }) => {
    return api(token, locale).get(`users/queries/tasks/locked/details/`, {
      signal,
    });
  };

  return useQuery({
    queryKey: ['locked-tasks'],
    queryFn: fetchLockedTasks,
    select: (data) => data.data?.tasks,
    gcTime: 0,
    throwOnError: true,
  });
};

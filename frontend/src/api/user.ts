import { useTypedSelector } from '@Store/hooks';
import { useQuery } from '@tanstack/react-query';

import api from './apiClient';

export const useLockedTasksQuery = () => {
  const token = useTypedSelector((state) => state.auth.token);
  const locale = useTypedSelector((state) => state.preferences['locale']);

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

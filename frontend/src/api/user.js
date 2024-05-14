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

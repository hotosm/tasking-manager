import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';

import api from './apiClient';

export const useTeamsQuery = (params, otherOptions) => {
  const token = useSelector((state) => state.auth.token);

  const fetchUserTeams = ({ signal }) => {
    return api(token).get(`teams/`, {
      signal,
      params: params,
    });
  };

  return useQuery({
    queryKey: ['user-teams', params],
    queryFn: fetchUserTeams,
    select: (data) => data.data,
    ...otherOptions,
  });
};

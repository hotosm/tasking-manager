import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';

import api from './apiClient';

export const useUserTeamsQuery = (userId) => {
  const token = useSelector((state) => state.auth.token);

  const fetchUserTeams = ({ signal }) => {
    return api(token).get(`teams/?omitMemberList=true&member=${userId}`, {
      signal,
    });
  };

  return useQuery({
    queryKey: ['user-teams', userId],
    queryFn: fetchUserTeams,
    enabled: !!userId,
    select: (data) => data.data,
    useErrorBoundary: true,
  });
};

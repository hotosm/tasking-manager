import { useTypedSelector } from '@Store/hooks';
import { useQuery } from '@tanstack/react-query';
import api from './apiClient';

export const useTeamsQuery = (params: any, otherOptions: any) => {
  const token = useTypedSelector((state) => state.auth.token);

  const fetchUserTeams = ({ signal }: {
    signal: AbortSignal;
  }) => {
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

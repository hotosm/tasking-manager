import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import api from './apiClient';
import type { RootStore } from '../store';

export const useTeamsQuery = (params: any, otherOptions: any) => {
  const token = useSelector((state: RootStore) => state.auth.token);

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

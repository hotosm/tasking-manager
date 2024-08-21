import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import api from './apiClient';
import { RootStore } from '../store';

export const useUserOrganisationsQuery = (userId: string | number) => {
  const token = useSelector((state: RootStore) => state.auth.token);

  const fetchOrganisations = ({ signal }: {
    signal: AbortSignal;
  }) => {
    return api(token).get(`organisations/`, {
      signal,
      params: {
        manager_user_id: userId,
        omitManagerList: true,
      },
    });
  };

  return useQuery({
    queryKey: ['user-organisations', userId],
    queryFn: fetchOrganisations,
    select: (data) => data.data,
  });
};

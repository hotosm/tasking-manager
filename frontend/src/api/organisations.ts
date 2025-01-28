import { useQuery } from '@tanstack/react-query';
import { useTypedSelector } from '@Store/hooks';

import api from './apiClient';

export const useUserOrganisationsQuery = (userId: string | number) => {
  const token = useTypedSelector((state) => state.auth.token);

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

import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import api from './apiClient';

export const useUserOrganisationsQuery = (userId) => {
  const token = useSelector((state) => state.auth.token);

  const fetchOrganisations = ({ signal }) => {
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

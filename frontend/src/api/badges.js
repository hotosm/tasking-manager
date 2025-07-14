import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import api from './apiClient';

export const useBadgesQuery = (userId) => {
  const token = useSelector((state) => state.auth.token);

  const fetchBadges = ({ signal }) => {
    return api(token).get(`badges/user/${userId}`, {
      signal,
    });
  };

  return useQuery({
    queryKey: ['user-badges', userId],
    queryFn: fetchBadges,
    select: (data) => data.data.badges,
  });
};

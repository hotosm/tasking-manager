import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';

import { backendToQueryConversion } from '../hooks/UseInboxQueryAPI';
import { remapParamsToAPI } from '../utils/remapParamsToAPI';
import api from './apiClient';

export const useNotificationsQuery = (inboxQuery) => {
  const token = useSelector((state) => state.auth.token);
  const fetchNotifications = async (signal, queryKey) => {
    const [, inboxQuery] = queryKey;
    const response = await api(token).get(`notifications/?${serializeParams(inboxQuery)}`, {
      signal,
    });
    return response.data;
  };

  return useQuery({
    queryKey: ['notifications', inboxQuery],
    queryFn: ({ signal, queryKey }) => fetchNotifications(signal, queryKey),
    keepPreviousData: true,
    placeholderData: {},
  });
};

export const useUnreadNotificationsCountQuery = () => {
  const token = useSelector((state) => state.auth.token);
  const fetchUnreadNotificationCount = async (signal) => {
    const response = await api(token).get('notifications/queries/own/count-unread/', {
      signal,
    });
    return response.data;
  };

  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: ({ signal }) => fetchUnreadNotificationCount(signal),
    refetchInterval: 1000 * 30,
    refetchOnWindowFocus: true,
  });
};

function serializeParams(queryState) {
  const obj = remapParamsToAPI(queryState, backendToQueryConversion);

  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  });

  return Object.entries(obj)
    .map(([key, val]) => `${key}=${val}`)
    .join('&');
}

import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import api from './apiClient';
import { RootStore } from '../store';

export const useCommentsQuery = (projectId: string, page: number) => {
  const token = useSelector((state: RootStore) => state.auth.token);
  const locale = useSelector((state: RootStore) => state.preferences['locale']);

  const getComments = ({ signal }: {
    signal: AbortSignal;
  }) => {
    return api(token, locale).get(`projects/${projectId}/comments/`, {
      signal,
      params: {
        perPage: 5,
        page,
      },
    });
  };

  return useQuery({
    queryKey: ['questions-and-comments', projectId, page],
    queryFn: getComments,
    select: (data) => data.data,
  });
};

export const postProjectComment = (projectId: string, comment: string, token: string, locale: string = 'en') => {
  return api(token, locale).post(`projects/${projectId}/comments/`, { message: comment });
};

export const postTaskComment = (projectId: string, taskId: number, comment: string, token: string, locale: string = 'en') => {
  return api(token, locale).post(`projects/${projectId}/comments/tasks/${taskId}/`, {
    comment,
  });
};

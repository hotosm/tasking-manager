import { useQuery } from '@tanstack/react-query';
import { useTypedSelector } from '@Store/hooks';

import api from './apiClient';

export const useCommentsQuery = (projectId: string, page: number) => {
  const token = useTypedSelector((state) => state.auth.token);
  const locale = useTypedSelector((state) => state.preferences['locale']);

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

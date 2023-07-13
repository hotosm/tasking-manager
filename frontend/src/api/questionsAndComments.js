import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import api from './apiClient';

export const useCommentsQuery = (projectId, page) => {
  const token = useSelector((state) => state.auth.token);
  const locale = useSelector((state) => state.preferences['locale']);

  const getComments = ({ signal }) => {
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

export const postProjectComment = (projectId, comment, token, locale = 'en') => {
  return api(token, locale).post(`projects/${projectId}/comments/`, { message: comment });
};

export const postTaskComment = (projectId, taskId, comment, token, locale = 'en') => {
  return api(token, locale).post(`projects/${projectId}/comments/tasks/${taskId}/`, {
    comment,
  });
};

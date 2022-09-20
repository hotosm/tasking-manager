import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { fetchLocalJSONAPI } from '../network/genericJSONRequest';

export const useGetLockedTasks = (taskId) => {
  const lockedTasks = useSelector((state) => state.lockedTasks);
  return lockedTasks;
};

export const useFetchLockedTasks = () => {
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const memoCallback = useCallback(async () => {
    if (token) {
      const lockedTasks = await fetchLocalJSONAPI('users/queries/tasks/locked/', token);
      dispatch({ type: 'SET_LOCKED_TASKS', tasks: lockedTasks.lockedTasks || [] });
      dispatch({ type: 'SET_PROJECT', project: lockedTasks.projectId || null });
      dispatch({ type: 'SET_TASKS_STATUS', status: lockedTasks.taskStatus || null });
    }
  }, [token, dispatch]);
  return memoCallback;
};

export const useClearLockedTasks = () => {
  const dispatch = useDispatch();
  const memoCallback = useCallback(() => {
    dispatch({ type: 'SET_LOCKED_TASKS', tasks: [] });
    dispatch({ type: 'SET_PROJECT', project: null });
    dispatch({ type: 'SET_TASKS_STATUS', status: null });
  }, [dispatch]);
  return memoCallback;
};

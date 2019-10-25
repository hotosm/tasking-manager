import { useSelector } from 'react-redux';

export const useGetLockedTasks = taskId => {
  const lockedTasks = useSelector(state => state.lockedTasks.get('tasks'));
  const activeProject = useSelector(state => state.lockedTasks.get('project'));

  return [lockedTasks, activeProject];
};

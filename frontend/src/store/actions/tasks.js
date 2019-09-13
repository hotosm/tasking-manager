
export const types = {
  SET_ACTIVE_TASKS: 'SET_ACTIVE_TASKS',
  SET_ACTIVE_PROJECT: 'SET_ACTIVE_PROJECT',
  SET_TASKS_STATUS: 'SET_TASKS_STATUS',
  CLEAR_ACTIVE_TASKS: 'CLEAR_ACTIVE_TASKS',
};

export function updateActiveProject(activeProject) {
  return {
    type: types.SET_ACTIVE_PROJECT,
    activeProject: activeProject
  };
}

export function updateActiveTasks(activeTasks) {
  return {
    type: types.SET_ACTIVE_TASKS,
    activeTasks: activeTasks
  };
}

export function updateTasksStatus(status) {
  return {
    type: types.SET_TASKS_STATUS,
    status: status
  };
}

export function clearActiveTasks() {
  return {
    type: types.CLEAR_ACTIVE_TASKS,
  };
}

export const setActiveTasks = (tasks, projectId) => dispatch => {
  dispatch(updateActiveTasks(tasks));
  dispatch(updateActiveProject(projectId));
};

export const setTasksStatus = (status) => dispatch => {
  dispatch(updateTasksStatus(status));
};

import { Dispatch } from "redux";

export const types = {
  SET_LOCKED_TASKS: 'SET_LOCKED_TASKS',
  SET_PROJECT: 'SET_PROJECT',
  SET_TASKS_STATUS: 'SET_TASKS_STATUS',
  CLEAR_LOCKED_TASKS: 'CLEAR_LOCKED_TASKS',
} as const;

export function updateProject(project: any) {
  return {
    type: types.SET_PROJECT,
    project: project,
  };
}

export function updateLockedTasks(tasks: any) {
  return {
    type: types.SET_LOCKED_TASKS,
    tasks: tasks,
  };
}

export function updateTasksStatus(status: any) {
  return {
    type: types.SET_TASKS_STATUS,
    status: status,
  };
}

export function clearLockedTasks() {
  return {
    type: types.CLEAR_LOCKED_TASKS,
  };
}

export const setLockedTasks = (tasks, projectId) => (dispatch: Dispatch) => {
  dispatch(updateLockedTasks(tasks));
  dispatch(updateProject(projectId));
};

export const setTasksStatus = (status) => (dispatch: Dispatch) => {
  dispatch(updateTasksStatus(status));
};

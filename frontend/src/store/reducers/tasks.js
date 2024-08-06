import { types } from '../actions/tasks';

const initialState = {
  project: null,
  tasks: [],
  status: null,
};

export function tasksReducer(state = initialState, action) {
  switch (action.type) {
    case types.SET_PROJECT: {
      return { ...state, project: action.project };
    }
    case types.SET_LOCKED_TASKS: {
      return { ...state, tasks: action.tasks };
    }
    case types.SET_TASKS_STATUS: {
      return { ...state, status: action.status };
    }
    case types.CLEAR_LOCKED_TASKS: {
      return initialState;
    }
    default:
      return state;
  }
}

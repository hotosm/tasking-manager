import { Map } from 'immutable';

import { types } from '../actions/tasks';

const initialState = Map({
  project: null,
  tasks: [],
  status: null,
});

export function tasksReducer(state = initialState, action) {
  switch (action.type) {
    case types.SET_PROJECT: {
      return state.set('project', action.project);
    }
    case types.SET_LOCKED_TASKS: {
      return state.set('tasks', action.tasks);
    }
    case types.SET_TASKS_STATUS: {
      return state.set('status', action.status);
    }
    case types.CLEAR_LOCKED_TASKS: {
      return initialState;
    }
    default:
      return state;
  }
}

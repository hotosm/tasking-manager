import { Map } from 'immutable';

import { types } from '../actions/tasks';


const initialState = Map({
  activeProject: null,
  activeTasks: [],
  status: null
});

export function tasksReducer(state = initialState, action) {
  switch (action.type) {
    case types.SET_ACTIVE_PROJECT: {
      return state.set('activeProject', action.activeProject);
    }
    case types.SET_ACTIVE_TASKS: {
      return state.set('activeTasks', action.activeTasks);
    }
    case types.SET_TASKS_STATUS: {
      return state.set('status', action.status);
    }
    case types.CLEAR_ACTIVE_TASKS: {
      return initialState;
    }
    default:
      return state;
  }
}

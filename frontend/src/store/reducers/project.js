import { Map } from 'immutable';
import { types } from '../actions/project';

const initialState = Map({
  projectId: null,
  params: {},
});

export function projectReducer(state = initialState, action) {
  switch (action.type) {
    case types.CREATE_PROJECT: {
      return state.set('params', action.params);
    }
    case types.SET_ID: {
      return state.set('projectId', action.projectId);
    }
    default:
      return state;
  }
}

import { types } from '../actions/project';

const initialState = {
  projectId: null,
  params: {},
};

export function projectReducer(state = initialState, action) {
  switch (action.type) {
    case types.CREATE_PROJECT: {
      return { ...state, params: action.params };
    }
    case types.SET_ID: {
      return { ...state, projectId: action.projectId };
    }
    default:
      return state;
  }
}

import { types } from '../actions/project';

type ProjectState = {
  projectId: string | null,
  params: any,
};

const initialState = {
  projectId: null,
  params: {},
} satisfies ProjectState;

type Actions = {
  type: typeof types.CREATE_PROJECT
  params: any
} | {
  type: typeof types.SET_ID,
  projectId: string
};

export function projectReducer(state = initialState, action: Actions) {
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

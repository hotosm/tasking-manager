import { types } from '../actions/editor';

const initialState = {
  context: null,
  rapidContext: { context: null, dom: null },
};

export function editorReducer(state = initialState, action) {
  switch (action.type) {
    case types.SET_EDITOR: {
      return {
        ...state,
        context: action.context,
      };
    }
    case types.SET_RAPIDEDITOR: {
      return {
        ...state,
        rapidContext: action.context,
      };
    }
    default:
      return state;
  }
}

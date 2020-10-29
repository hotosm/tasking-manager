import { types } from '../actions/editor';

const initialState = {
  context: null,
};

export function editorReducer(state = initialState, action) {
  switch (action.type) {
    case types.SET_EDITOR: {
      return {
        ...state,
        context: action.context,
      };
    }
    default:
      return state;
  }
}

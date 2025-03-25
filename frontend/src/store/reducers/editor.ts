import { types } from '../actions/editor';

type EditorState = {
  context: any;
  rapidContext: { context: any; dom: any };
};

const initialState = {
  context: null,
  rapidContext: { context: null, dom: null },
} satisfies EditorState;

type Actions = {
  type: typeof types.SET_EDITOR;
  context: any;
} | {
  type: typeof types.SET_RAPIDEDITOR;
  context: { context: any; dom: any };
}

export function editorReducer(state = initialState, action: Actions) {
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

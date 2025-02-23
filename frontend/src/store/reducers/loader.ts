import { types } from '../actions/loader';

const initialState = {
  isLoading: false,
} satisfies { isLoading: boolean; };

type Actions = {
  type: typeof types.SET_LOADER;
  isLoading: boolean;
}

export function loaderReducer(state: {
  isLoading: boolean;
} = initialState, action: Actions): {
  isLoading: boolean;
} {
  switch (action.type) {
    case types.SET_LOADER: {
      return {
        ...state,
        isLoading: action.isLoading,
      };
    }
    default:
      return state;
  }
}

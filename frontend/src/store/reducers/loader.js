import { types } from '../actions/loader';

const initialState = {
  isLoading: false,
};

export function loaderReducer(state = initialState, action) {
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

const initialState = {
  isVisible: true,
};

export function orgBarVisibilityReducer(state = initialState, action) {
  switch (action.type) {
    case 'SET_VISIBILITY': {
      return {
        ...state,
        isVisible: action.isVisible,
      };
    }
    default:
      return state;
  }
}

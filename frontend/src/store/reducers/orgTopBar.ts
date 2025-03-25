const initialState = {
  isVisible: true,
} satisfies {
  isVisible: boolean;
};

type Actions = {
  type: 'SET_VISIBILITY';
  isVisible: boolean;
}

export function orgBarVisibilityReducer(state: {
  isVisible: boolean;
} = initialState, action: Actions) {
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

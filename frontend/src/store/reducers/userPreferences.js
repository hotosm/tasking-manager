import { types } from '../actions/userPreferences';

const initialState = {
  locale: null,
  mapShown: false,
  action: 'any',
};

export function preferencesReducer(state = initialState, action) {
  switch (action.type) {
    case types.SET_LOCALE: {
      return {
        ...state,
        locale: action.locale,
      };
    }
    case types.SET_ACTION: {
      return {
        ...state,
        action: action.action,
      };
    }
    case types.TOGGLE_MAP: {
      return {
        ...state,
        mapShown: !state.mapShown,
      };
    }
    default:
      return state;
  }
}

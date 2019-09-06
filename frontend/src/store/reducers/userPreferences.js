import { types } from '../actions/userPreferences';


const initialState = {
  locale: 'en',
  mapShown: false
};

export function preferencesReducer(state = initialState, action) {
  switch (action.type) {
    case types.SET_LOCALE: {
      return {
        ...state,
        'locale': action.locale
      };
    }
    case types.TOGGLE_MAP: {
      return {
        ...state,
        'mapShown': !state.mapShown
      };
    }
    default:
      return state;
  }
}

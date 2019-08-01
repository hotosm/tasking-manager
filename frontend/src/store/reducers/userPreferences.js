import { types } from '../actions/userPreferences';


const initialState = {
  locale: 'en'
};

export function preferencesReducer(state = initialState, action) {
  switch (action.type) {
    case types.SET_LOCALE: {
      return {
        'locale': action.locale
      };
    }
    default:
      return state;
  }
}

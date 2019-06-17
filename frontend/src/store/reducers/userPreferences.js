import { types } from '../actions/userPreferences';

const initialState = {
  language: 'english'
};

export function preferencesReducer(state = initialState, action) {
  switch (action.type) {
    case types.SET_LANGUAGE: {
      return {
        'language': action.language
      };
    }
    default:
      return state;
  }
}

import { types } from '../actions/auth';

const initialState = {
  user: {}
};

export function userReducer (state = initialState, action) {
  switch (action.type) {
    case types.REGISTER_USER: {
      return {
          ...state,
          user: action.payload
        };
      }
    default:
      return state;
  }
}
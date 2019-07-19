import { types } from '../actions/authorize';

const initialState = {
  username: '',
  token: '',
  id: ''
};

export function authorizationReducer (state = initialState, action) {
  switch (action.type) {
    case types.SET_AUTH_DETAILS: {
      return {
        'username': action.username,
        'token': action.token,
        'id': action.username
      };
    }
    default:
      return state;
  }
}

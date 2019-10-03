import { Map } from 'immutable';

import { types } from '../actions/auth';


const initialState = Map({
  userDetails: {},
  token: '',
});

export function authorizationReducer(state = initialState, action) {
  switch (action.type) {
    case types.SET_USER_DETAILS: {
      return state.set('userDetails', action.userDetails);
    }
    case types.SET_TOKEN: {
      return state.set('token', action.token)
    }
    case types.CLEAR_SESSION: {
      return initialState;
    }
    default:
      return state;
  }
}

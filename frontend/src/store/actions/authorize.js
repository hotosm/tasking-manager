import * as safeStorage from '../../utils/safe_storage';

export const types = {
  SET_AUTH_DETAILS: 'SET_AUTH_DETAILS'
};

export function updateAuthDetails(username, token) {
  return {
    type: types.SET_AUTH_DETAILS,
    username: username,
    token: token
  };
}

export const setAuthDetails= (username, token) => dispatch => {
    const encoded_token = btoa(token);
    safeStorage.setItem('username', username);
    safeStorage.setItem('token', encoded_token);
    dispatch(updateAuthDetails(username, encoded_token));
  }

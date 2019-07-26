import * as safeStorage from '../../utils/safe_storage';
import { fetchUserDetails } from '../../network/auth';


export const types = {
  SET_USER_DETAILS: 'SET_USER_DETAILS',
  SET_TOKEN: 'SET_TOKEN',
  CLEAR_SESSION: 'CLEAR_SESSION'
};

export function clearUserDetails() {
  return {
    type: types.CLEAR_SESSION,
  };
}

export const logout = () => dispatch => {
  safeStorage.removeItem('username');
  safeStorage.removeItem('token');
  dispatch(clearUserDetails());
};

export function updateUserDetails(userDetails) {
  return {
    type: types.SET_USER_DETAILS,
    userDetails: userDetails
  };
}

export function updateToken(token) {
  return {
    type: types.SET_TOKEN,
    token: token
  };
}

export const setAuthDetails= (username, token) => dispatch => {
    const encoded_token = btoa(token);
    safeStorage.setItem('username', username);
    safeStorage.setItem('token', encoded_token);
    dispatch(updateToken(encoded_token));
    fetchUserDetails(username, encoded_token).then(
      userDetails => dispatch(updateUserDetails(userDetails))
    );
  }

export const setUserDetails= (userDetails) => dispatch => {
    dispatch(updateUserDetails(userDetails));
  }

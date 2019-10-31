import * as safeStorage from '../../utils/safe_storage';
import { fetchUserDetails } from '../../network/auth';
import { pushToLocalJSONAPI } from '../../network/genericJSONRequest';

export const types = {
  SET_USER_DETAILS: 'SET_USER_DETAILS',
  GET_USER_DETAILS: 'GET_USER_DETAILS',
  SET_TOKEN: 'SET_TOKEN',
  CLEAR_SESSION: 'CLEAR_SESSION',
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
    userDetails: userDetails,
  };
}

export function updateToken(token) {
  return {
    type: types.SET_TOKEN,
    token: token,
  };
}

export const setAuthDetails = (username, token) => dispatch => {
  const encoded_token = btoa(token);
  safeStorage.setItem('token', encoded_token);
  safeStorage.setItem('username', username);
  dispatch(updateToken(encoded_token));
  dispatch(setUserDetails(username, encoded_token));
};

export const setUserDetails = (username, encoded_token) => dispatch => {
  fetchUserDetails(username, encoded_token)
    .then(userDetails => dispatch(updateUserDetails(userDetails)))
    .catch(error => dispatch(logout()));
};

export const getUserDetails = state => dispatch => {
  if (state.auth.getIn(['userDetails', 'username'])) {
    dispatch(
      setUserDetails(state.auth.getIn(['userDetails', 'username']), state.auth.get('token')),
    );
  }
};

export const pushUserDetails = (userDetails, token) => dispatch => {
  pushToLocalJSONAPI(`users/actions/set-user/`, userDetails, token, 'PATCH').then(data =>
    dispatch(setUserDetails(safeStorage.getItem('username'), token)),
  );
};

import * as safeStorage from '../../utils/safe_storage';
import { pushToLocalJSONAPI, fetchLocalJSONAPI } from '../../network/genericJSONRequest';

export const types = {
  REGISTER_USER: 'REGISTER_USER',
  SET_USER_DETAILS: 'SET_USER_DETAILS',
  SET_OSM: 'SET_OSM',
  UPDATE_OSM_INFO: 'UPDATE_OSM_INFO',
  GET_USER_DETAILS: 'GET_USER_DETAILS',
  SET_TOKEN: 'SET_TOKEN',
  CLEAR_SESSION: 'CLEAR_SESSION',
};

export function clearUserDetails() {
  return {
    type: types.CLEAR_SESSION,
  };
}

export const updateUserEmail = (userDetails, token, relevant_fields) => dispatch => {
  const filtered = Object.keys(userDetails)
    .filter(key => relevant_fields.includes(key))
    .reduce((obj, key) => {
      obj[key] = userDetails[key];
      return obj;
    }, {});
  const payload = JSON.stringify(filtered);

  pushToLocalJSONAPI(`users/actions/set-user/`, payload, token, 'PATCH').then(() => {
      dispatch({
        type: types.SET_USER_DETAILS,
        userDetails: userDetails
      })
    }
  )
};

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

export function updateOSMInfo(osm) {
  return {
    type: types.SET_OSM,
    osm: osm,
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
  // UPDATES OSM INFORMATION OF THE USER
  fetchLocalJSONAPI(`users/${username}/openstreetmap/`, encoded_token)
    .then(osmInfo => dispatch(updateOSMInfo(osmInfo)))
    .catch(error => console.log(error));
  // GET USER DETAILS
  fetchLocalJSONAPI(`users/queries/${username}/`, encoded_token)
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

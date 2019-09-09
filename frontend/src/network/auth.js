import { handleErrors } from '../utils/promise';
import { API_URL } from '../config';

export function fetchUserDetails(username, token) {
  return fetch(`${API_URL}users/queries/${username}/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Token ${token}` : '',
    },
  })
    .then(handleErrors)
    .then(res => {
      return res.json();
    });
}

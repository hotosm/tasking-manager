import { handleErrors } from '../utils/promise';
import { API_URL } from '../config';


export function postNewUser(user) {
  return fetch(`${API_URL}user/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: user
  })
    .then(handleErrors)
    .then(res => {
      return res.json();
    });
}
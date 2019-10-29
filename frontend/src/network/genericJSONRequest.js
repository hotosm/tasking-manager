import { handleErrors } from '../utils/promise';
import { API_URL } from '../config';

export function fetchExternalJSONAPI(url): Promise<*> {
  return fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(handleErrors)
    .then(res => {
      return res.json();
    });
}

export function fetchLocalJSONAPI(endpoint, token): Promise<*> {
  const url = new URL(endpoint, API_URL);
  let headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  return fetch(url, {
    method: 'GET',
    headers: headers,
  })
    .then(handleErrors)
    .then(res => {
      return res.json();
    });
}

export function pushToLocalJSONAPI(endpoint, payload, token, method = 'POST'): Promise<*> {
  const url = new URL(endpoint, API_URL);
  return fetch(url, {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    },
    body: payload,
  })
    .then(handleErrors)
    .then(res => {
      return res.json();
    });
}
